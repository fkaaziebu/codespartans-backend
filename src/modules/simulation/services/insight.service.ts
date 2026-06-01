import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { Repository } from 'typeorm';
import { Student } from '../../auth/entities/student.entity';
import { Test, TestStatusType } from '../entities/test.entity';
import { TimeEventType } from '../entities/time_event.entity';
import {
  WeeklyInsight,
  WeeklyInsightSuite,
} from '../types/weekly-insight.type';

@Injectable()
export class InsightService {
  private readonly logger = new Logger(InsightService.name);
  private readonly anthropic: Anthropic;

  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Test)
    private testRepository: Repository<Test>,
    private configService: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async getWeeklyInsight({ email }: { email: string }): Promise<WeeklyInsight> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    const student = await this.studentRepository.findOne({ where: { email } });
    if (!student) {
      throw new NotFoundException('Student not found');
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

      this.logger.log(`Generated weekly insight for ${email}`);
      return result;
    } catch (err) {
      this.logger.error(
        `Failed to generate weekly insight for ${email}: ${(err as Error).message}`,
      );
      throw new BadRequestException('Failed to generate weekly insight');
    }
  }
}
