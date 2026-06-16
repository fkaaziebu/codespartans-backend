import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
  private readonly logger = new Logger(SemanticCacheService.name);
  private pipe: EmbeddingPipeline | null = null;

  constructor(
    @InjectRepository(SemanticCache)
    private readonly semanticCacheRepo: Repository<SemanticCache>,
    private readonly dataSource: DataSource,
  ) {}

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

  async findSimilar(
    questionId: string,
    embedding: number[],
  ): Promise<boolean | null> {
    const vectorSql = toSql(embedding);
    const rows: Array<{ is_correct: boolean; similarity: number }> =
      await this.dataSource.query(
        `
        SELECT is_correct,
               1 - (query_embedding <=> $1::vector) AS similarity
        FROM   semantic_caches
        WHERE  question_id = $2
          AND  expires_at  > $3
          AND  1 - (query_embedding <=> $1::vector) >= $4
        ORDER  BY query_embedding <=> $1::vector
        LIMIT  1
        `,
        [vectorSql, questionId, new Date(), SIMILARITY_THRESHOLD],
      );

    if (rows.length === 0) return null;

    this.logger.log(
      `Semantic cache hit (similarity=${Number(rows[0].similarity).toFixed(4)}) for question ${questionId}`,
    );
    return rows[0].is_correct;
  }

  async store(
    questionId: string,
    queryText: string,
    embedding: number[],
    isCorrect: boolean,
  ): Promise<void> {
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
      [questionId, queryText, vectorSql, isCorrect, now, expiresAt],
    );

    this.logger.debug(`Stored semantic cache entry for question ${questionId}`);
  }

  async purgeExpired(): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM semantic_caches WHERE expires_at < NOW()`,
    );
  }
}
