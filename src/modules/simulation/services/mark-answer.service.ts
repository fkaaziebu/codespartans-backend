import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { Cache } from 'cache-manager';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';
import { SubmittedAnswer } from '../entities/sumitted_answer.entity';
import { SemanticCacheService } from './semantic-cache.service';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Normalizes answer text for comparison and cache-key purposes:
 * lowercase, accent-stripped, trailing-punctuation-stripped, whitespace
 * collapsed. "Paris", "paris", "Paris.", " PARIS " all normalize to
 * the same value.
 */
export function normalizeAnswer(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents (é -> e)
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"]+$/g, '') // strip trailing punctuation
    .replace(/\s+/g, ' ');
}

@Injectable()
export class MarkAnswerService {
  private readonly log = this.loggerRegistry.getLogger('simulation');
  private readonly anthropic: Anthropic;

  constructor(
    @InjectRepository(SubmittedAnswer)
    private submittedAnswerRepository: Repository<SubmittedAnswer>,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private semanticCacheService: SemanticCacheService,
    private readonly loggerRegistry: ModuleLoggerRegistry,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async markShortAnswer(submittedAnswerId: string): Promise<SubmittedAnswer> {
    const submittedAnswer = await this.submittedAnswerRepository.findOne({
      where: { id: submittedAnswerId },
      relations: ['question'],
    });

    if (!submittedAnswer) {
      this.log.warn(
        { submittedAnswerId },
        'simulation.mark_answer.submitted_answer_not_found',
      );
      throw new NotFoundException(
        `SubmittedAnswer ${submittedAnswerId} not found`,
      );
    }

    // Idempotency guard: never silently re-grade an answer that's already
    // been marked. Without this, any retry/requeue of this method (e.g.
    // after a transient failure) can overwrite a correct prior result.
    if (submittedAnswer.is_marked) {
      this.log.warn(
        { submittedAnswerId, isCorrect: submittedAnswer.is_correct },
        'simulation.mark_answer.already_marked',
      );
      return submittedAnswer;
    }

    const { question, answer_provided } = submittedAnswer;
    const normalized = normalizeAnswer(answer_provided);
    const cacheKey = this.buildCacheKey(
      question.id,
      question.description,
      question.correct_answer,
      normalized,
    );

    // ── Tier 0: deterministic exact match — zero AI cost, zero embedding cost
    const acceptableAnswers = this.getAcceptableAnswers(question);
    if (
      acceptableAnswers.some(
        (candidate) => normalizeAnswer(candidate) === normalized,
      )
    ) {
      this.log.info(
        { submittedAnswerId },
        'simulation.mark_answer.tier0_exact_match',
      );
      return this.finalize(submittedAnswer, true);
    }

    // ── Tier 1: L1 exact-hash cache — a previous LLM-graded answer to this
    // exact normalized string has already been resolved
    const cachedL1 = await this.cacheManager.get<boolean>(cacheKey);
    if (cachedL1 !== null && cachedL1 !== undefined) {
      this.log.info(
        { submittedAnswerId, isCorrect: cachedL1 },
        'simulation.mark_answer.tier1_l1_cache_hit',
      );
      return this.finalize(submittedAnswer, cachedL1);
    }

    // ── Tier 2: L2 semantic cache — matches only against confirmed-correct
    // answers to this question (see semantic-cache.service.ts). A bad match
    // here can only ever bless a correct answer, never wrongly fail one.
    let embedding: number[] | null = null;
    try {
      embedding = await this.semanticCacheService.embed(normalized);
      const semanticMatch = await this.semanticCacheService.findSimilar(
        question.id,
        embedding,
      );

      if (semanticMatch === true) {
        this.log.info(
          { submittedAnswerId },
          'simulation.mark_answer.tier2_semantic_cache_hit',
        );
        await this.cacheManager.set(cacheKey, true, THIRTY_DAYS_MS);
        return this.finalize(submittedAnswer, true);
      }
    } catch (embErr) {
      this.log.warn(
        { submittedAnswerId, err: (embErr as Error).message },
        'simulation.mark_answer.semantic_lookup_failed',
      );
      embedding = null;
    }

    // ── Tier 3: Claude LLM — only reached for genuinely novel or wrong answers
    return this.markWithLlm(submittedAnswer, normalized, cacheKey, embedding);
  }

  private async markWithLlm(
    submittedAnswer: SubmittedAnswer,
    normalizedAnswer: string,
    cacheKey: string,
    embedding: number[] | null,
  ): Promise<SubmittedAnswer> {
    const { question, answer_provided } = submittedAnswer;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text:
                  `You are an exam marker. Determine if the student's answer is correct based on the question and expected answer. Be flexible with phrasing, synonyms, and partial credit where appropriate.\n\n` +
                  `Question: ${question.description}\n` +
                  `Expected Answer: ${question.correct_answer}`,
                // Identical across every student answering this question —
                // marked cacheable so repeat calls bill the cached portion
                // at a discount. Only takes effect once the block exceeds
                // Anthropic's per-model minimum cacheable token count
                // (higher for Haiku); below that it's a harmless no-op.
                cache_control: { type: 'ephemeral' },
              },
              {
                type: 'text',
                text:
                  `Student's Answer: ${answer_provided}\n\n` +
                  `Respond with only a raw JSON object using exactly this shape — no markdown, no code fences, no extra keys: {"is_correct": true} or {"is_correct": false}`,
              },
            ],
          },
          {
            role: 'assistant',
            content: '{',
          },
        ],
      });

      const firstBlock = response.content[0];
      const raw =
        firstBlock && firstBlock.type === 'text' ? firstBlock.text : '';
      // Pre-filled assistant turn already opened the brace; reconstruct the object
      const text = ('{' + raw).replace(/```[a-z]*\n?/gi, '').trim();

      let result: { is_correct?: boolean; correct?: boolean };
      try {
        result = JSON.parse(text) as {
          is_correct?: boolean;
          correct?: boolean;
        };
      } catch (parseErr) {
        this.log.error(
          {
            submittedAnswerId: submittedAnswer.id,
            err: (parseErr as Error).message,
            raw: text,
          },
          'simulation.mark_answer.llm_response_parse_failed',
        );
        // Malformed response — leave unmarked rather than guessing at a score.
        return submittedAnswer;
      }

      const is_correct = result.is_correct ?? result.correct ?? false;

      await this.cacheManager.set(cacheKey, is_correct, THIRTY_DAYS_MS);

      // Only feed confirmed-correct answers into the semantic cache. Wrong
      // answers are never stored as a match target — this is what makes a
      // bad semantic match fail safe (can only cause an extra LLM call,
      // never a false "correct").
      if (is_correct && embedding !== null) {
        this.semanticCacheService
          .store(question.id, normalizedAnswer, embedding, true)
          .catch((storeErr) =>
            this.log.warn(
              { questionId: question.id, err: (storeErr as Error).message },
              'simulation.mark_answer.semantic_store_failed',
            ),
          );
      }

      this.log.info(
        { submittedAnswerId: submittedAnswer.id, isCorrect: is_correct },
        'simulation.mark_answer.tier3_llm_marked',
      );
      return this.finalize(submittedAnswer, is_correct);
    } catch (err) {
      // Distinguish failure types — an auth/billing failure means every
      // subsequent call will fail identically until someone intervenes,
      // and should page/alert loudly rather than look like a one-off.
      if (
        err instanceof Anthropic.AuthenticationError ||
        err instanceof Anthropic.PermissionDeniedError
      ) {
        this.log.error(
          {
            submittedAnswerId: submittedAnswer.id,
            err: (err as Error).message,
          },
          'simulation.mark_answer.anthropic_auth_error',
        );
      } else if (err instanceof Anthropic.RateLimitError) {
        this.log.warn(
          {
            submittedAnswerId: submittedAnswer.id,
            err: (err as Error).message,
          },
          'simulation.mark_answer.anthropic_rate_limited',
        );
      } else {
        this.log.error(
          {
            submittedAnswerId: submittedAnswer.id,
            err: (err as Error).message,
          },
          'simulation.mark_answer.llm_marking_failed',
        );
      }
      // Leave is_marked=false so the student sees it as pending, not wrong.
      // A failed AI call must never silently become a fail-closed wrong score.
      return submittedAnswer;
    }
  }

  private async finalize(
    submittedAnswer: SubmittedAnswer,
    isCorrect: boolean,
  ): Promise<SubmittedAnswer> {
    submittedAnswer.is_correct = isCorrect;
    submittedAnswer.is_marked = true;
    return this.submittedAnswerRepository.save(submittedAnswer);
  }

  /**
   * Returns every string that should count as an exact-match correct
   * answer for Tier 0. Reads an optional `acceptable_answers` array off
   * the question if present (e.g. "1789" and "seventeen eighty-nine" for
   * the same question) — degrades gracefully to just `correct_answer` if
   * that column doesn't exist yet on your Question entity.
   */
  private getAcceptableAnswers(
    question: SubmittedAnswer['question'],
  ): string[] {
    const answers = [question.correct_answer];
    const extra = (question as unknown as { acceptable_answers?: string[] })
      .acceptable_answers;
    if (Array.isArray(extra)) {
      answers.push(...extra);
    }
    return answers;
  }

  private buildCacheKey(
    questionId: string,
    description: string,
    correctAnswer: string,
    normalizedStudentAnswer: string,
  ): string {
    const hash = createHash('sha256')
      .update(`${description}|${correctAnswer}|${normalizedStudentAnswer}`)
      .digest('hex');
    return `mark-answer:${questionId}:${hash}`;
  }
}
