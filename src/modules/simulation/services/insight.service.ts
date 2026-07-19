import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';
import { Student } from '../../auth/entities/student.entity';
import { Test, TestStatusType } from '../entities/test.entity';
import { TimeEventType } from '../entities/time_event.entity';
import {
  WeeklyInsight,
  WeeklyInsightSuite,
} from '../types/weekly-insight.type';

@Injectable()
export class InsightService {
  private readonly log = this.loggerRegistry.getLogger('simulation');
  private readonly anthropic: Anthropic;

  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Test)
    private testRepository: Repository<Test>,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly loggerRegistry: ModuleLoggerRegistry,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async getWeeklyInsight({ id }: { id: string }): Promise<WeeklyInsight> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    const student = await this.studentRepository.findOne({ where: { id } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const cacheKey = `weekly-insight:${student.id}:${weekStart.toISOString()}`;
    const cached = await this.cacheManager.get<WeeklyInsight>(cacheKey);
    if (cached) {
      this.log.info(
        { studentId: student.id },
        'simulation.weekly_insight.cache_hit',
      );
      return cached;
    }

    const tests = await this.testRepository
      .createQueryBuilder('test')
      .innerJoinAndSelect('test.test_suite', 'suite')
      .innerJoinAndSelect('test.submitted_answers', 'answer')
      .innerJoin(
        'test.time_events',
        'te',
        'te.type = :started AND te.recorded_at >= :weekStart',
        { started: TimeEventType.STARTED, weekStart },
      )
      .where('test.student = :studentId', { studentId: student.id })
      .andWhere('test.status = :status', { status: TestStatusType.ENDED })
      .getMany();

    if (!tests.length) {
      throw new NotFoundException('No completed tests found for this week');
    }

    type SuiteAgg = {
      suite_id: string;
      title: string;
      correct: number;
      total: number;
    };

    const suiteMap = new Map<string, SuiteAgg>();

    for (const test of tests) {
      const { id: suite_id, title } = test.test_suite;
      if (!suiteMap.has(suite_id)) {
        suiteMap.set(suite_id, {
          suite_id,
          title: title ?? 'Untitled Suite',
          correct: 0,
          total: 0,
        });
      }
      const agg = suiteMap.get(suite_id)!;
      for (const answer of test.submitted_answers) {
        if (!answer.is_marked) continue;
        agg.total += 1;
        if (answer.is_correct === true) agg.correct += 1;
      }
    }

    const suiteStats = Array.from(suiteMap.values()).map((agg) => ({
      suite_id: agg.suite_id,
      title: agg.title,
      correct: agg.correct,
      total: agg.total,
      accuracy:
        agg.total > 0
          ? Math.round((agg.correct / agg.total) * 10000) / 100
          : 0,
    }));

    const prompt = `You are an educational AI coach. A student completed the following test suites this week.
Identify their single biggest struggle area and produce a motivating insight card.

Suite performance:
${JSON.stringify(suiteStats, null, 2)}

Rules:
- title: one short sentence — "You're struggling with [Suite] — your accuracy dropped to X%"
- description: 2 sentences max, reference specific numbers, end with an action prompt
- suites: ALL suites sorted by accuracy ascending (worst first), each as {suite_id, title, accuracy}

Respond with only a raw JSON object — no markdown, no code fences, no extra keys:
{"title": "...", "description": "...", "suites": [{"suite_id": "...", "title": "...", "accuracy": 0.0}]}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [
          { role: 'user', content: prompt },
          { role: 'assistant', content: '{' },
        ],
      });

      const raw =
        response.content[0].type === 'text' ? response.content[0].text : '';
      const text = ('{' + raw).replace(/```[a-z]*\n?/gi, '').trim();

      const result = JSON.parse(text) as {
        title: string;
        description: string;
        suites: WeeklyInsightSuite[];
      };

      const ttl = this.msUntilNextMonday(now);
      await this.cacheManager.set(cacheKey, result, ttl);

      this.log.info(
        { studentId: id },
        'simulation.weekly_insight.generated',
      );
      return result;
    } catch (err) {
      this.log.error(
        { studentId: id, err: (err as Error).message },
        'simulation.weekly_insight.generation_failed',
      );
      throw new BadRequestException('Failed to generate weekly insight');
    }
  }

  async invalidateForStudent(studentId: string): Promise<void> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    await this.cacheManager.del(
      `weekly-insight:${studentId}:${weekStart.toISOString()}`,
    );
  }

  private msUntilNextMonday(from: Date): number {
    const next = new Date(from);
    const daysUntilMonday = (8 - next.getDay()) % 7 || 7;
    next.setDate(next.getDate() + daysUntilMonday);
    next.setHours(0, 0, 0, 0);
    return Math.max(next.getTime() - from.getTime(), 60_000);
  }
}
