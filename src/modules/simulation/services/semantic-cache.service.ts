import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';
import { SemanticCache } from '../entities/semantic_cache.entity';

// pgvector uses package.json exports which require node16/bundler moduleResolution.
// require() bypasses that constraint without changing tsconfig.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { toSql } = require('pgvector') as { toSql: (arr: number[]) => string };

const SIMILARITY_THRESHOLD = 0.95;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

type EmbeddingPipeline = (
  text: string,
  opts: Record<string, unknown>,
) => Promise<{ data: ArrayLike<number> }>;

@Injectable()
export class SemanticCacheService {
  private readonly log = this.loggerRegistry.getLogger('simulation');
  private pipe: EmbeddingPipeline | null = null;

  constructor(
    @InjectRepository(SemanticCache)
    private readonly semanticCacheRepo: Repository<SemanticCache>,
    private readonly dataSource: DataSource,
    private readonly loggerRegistry: ModuleLoggerRegistry,
  ) {}

  /**
   * Embed the given text. Callers should pass ONLY the normalized answer
   * text here — not the question or expected answer. Every submission to
   * the same question shares an identical question/expected-answer
   * string, so including it in the embedded text dilutes the actual
   * signal (the student's answer) and can cause unrelated answers to
   * different students to register as falsely similar. Scoping by
   * question is handled separately, in the SQL WHERE clause below.
   */
  async embed(text: string): Promise<number[]> {
    if (!this.pipe) {
      const { pipeline } = await import('@xenova/transformers');
      this.pipe = (await pipeline(
        'feature-extraction',
        MODEL_NAME,
      )) as unknown as EmbeddingPipeline;
    }
    const output = await this.pipe(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data) as number[];
  }

  /**
   * Looks for a previously confirmed-correct answer to this question
   * whose embedding is within SIMILARITY_THRESHOLD of the given one.
   * Only ever matches against is_correct = true rows — a wrong answer
   * is never used as a match target, so a false positive here can only
   * ever mark something correct that a human/LLM already confirmed was
   * a valid phrasing, never wrongly fail a new answer.
   *
   * Returns true on a match, or null if nothing met the bar (never
   * returns false — "not similar enough to a known-correct answer" is
   * not the same claim as "this is wrong", so that judgment is left to
   * the LLM tier).
   */
  async findSimilar(
    questionId: string,
    embedding: number[],
  ): Promise<boolean | null> {
    const vectorSql = toSql(embedding);
    const rows: Array<{ similarity: number }> = await this.dataSource.query(
      `
      SELECT 1 - (query_embedding <=> $1::vector) AS similarity
      FROM   semantic_caches
      WHERE  question_id = $2
        AND  is_correct   = true
        AND  expires_at   > $3
        AND  1 - (query_embedding <=> $1::vector) >= $4
      ORDER  BY query_embedding <=> $1::vector
      LIMIT  1
      `,
      [vectorSql, questionId, new Date(), SIMILARITY_THRESHOLD],
    );

    if (rows.length === 0) return null;

    this.log.info(
      { questionId, similarity: Number(rows[0].similarity.toFixed(4)) },
      'simulation.semantic_cache.hit',
    );
    return true;
  }

  /**
   * Stores an answer's embedding as a future match target. Only ever
   * called with isCorrect = true by design — the cache exists to let
   * confirmed-correct paraphrases skip the LLM, not to auto-fail future
   * answers that resemble a past wrong one. Guarded here too, defensively,
   * in case a future caller forgets the check at the call site.
   */
  async store(
    questionId: string,
    queryText: string,
    embedding: number[],
    isCorrect: boolean,
  ): Promise<void> {
    if (!isCorrect) {
      this.log.warn(
        { questionId },
        'simulation.semantic_cache.store_rejected_incorrect',
      );
      return;
    }

    const vectorSql = toSql(embedding);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);

    await this.dataSource.query(
      `
      INSERT INTO semantic_caches
        (id, question_id, query_text, query_embedding, is_correct, created_at, expires_at)
      VALUES
        (uuid_generate_v4(), $1, $2, $3::vector, $4, $5, $6)
      `,
      [questionId, queryText, vectorSql, true, now, expiresAt],
    );

    this.log.debug({ questionId }, 'simulation.semantic_cache.stored');
  }

  async purgeExpired(): Promise<void> {
    const deleted: unknown[] = await this.dataSource.query(
      `DELETE FROM semantic_caches WHERE expires_at < NOW() RETURNING id`,
    );

    this.log.info(
      { deletedCount: deleted.length },
      'simulation.semantic_cache.purged_expired',
    );
  }
}
