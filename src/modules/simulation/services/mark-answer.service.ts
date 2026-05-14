import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { Repository } from 'typeorm';
import { SubmittedAnswer } from '../entities/sumitted_answer.entity';

@Injectable()
export class MarkAnswerService {
  private readonly logger = new Logger(MarkAnswerService.name);
  private readonly anthropic: Anthropic;

  constructor(
    @InjectRepository(SubmittedAnswer)
    private submittedAnswerRepository: Repository<SubmittedAnswer>,
    private configService: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async markShortAnswer(submittedAnswerId: string): Promise<void> {
    const submittedAnswer = await this.submittedAnswerRepository.findOne({
      where: { id: submittedAnswerId },
      relations: ['question'],
    });

    if (!submittedAnswer) {
      this.logger.warn(`SubmittedAnswer ${submittedAnswerId} not found`);
      return;
    }

    const { question, answer_provided } = submittedAnswer;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: `You are an exam marker. Determine if the student's answer is correct based on the question and expected answer. Be flexible with phrasing, synonyms, and partial credit where appropriate.

Question: ${question.description}
Expected Answer: ${question.correct_answer}
Student's Answer: ${answer_provided}

Respond with only a raw JSON object using exactly this shape — no markdown, no code fences, no extra keys: {"is_correct": true} or {"is_correct": false}`,
          },
          {
            role: 'assistant',
            content: '{',
          },
        ],
      });

      const raw =
        response.content[0].type === 'text' ? response.content[0].text : '';
      // Pre-filled assistant turn already opened the brace; reconstruct the object
      const text = ('{' + raw).replace(/```[a-z]*\n?/gi, '').trim();

      const result = JSON.parse(text) as { is_correct?: boolean; correct?: boolean };
      const is_correct = result.is_correct ?? result.correct ?? false;

      submittedAnswer.is_correct = is_correct;
      submittedAnswer.is_marked = true;

      console.log('RESULT:', result);

      const final_result =
        await this.submittedAnswerRepository.save(submittedAnswer);
      console.log('FINAL_RESULT:', final_result);

      this.logger.log(
        `Marked answer ${submittedAnswerId}: is_correct=${is_correct}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to mark answer ${submittedAnswerId}: ${(err as Error).message}`,
      );
      // Leave is_marked=false so the student can see it is still pending
    }
  }
}
