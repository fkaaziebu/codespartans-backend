import { MigrationInterface, QueryRunner } from 'typeorm';

export class SemanticCache1780600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [ext] = await queryRunner.query(
      `SELECT name FROM pg_available_extensions WHERE name = 'vector'`,
    );
    if (!ext) {
      // pgvector binary is not installed in this PostgreSQL — skip semantic cache table
      return;
    }
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "semantic_caches" (
        "id"              uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "question_id"     uuid        NOT NULL,
        "query_text"      text        NOT NULL,
        "query_embedding" vector(384) NOT NULL,
        "is_correct"      boolean     NOT NULL,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "expires_at"      timestamptz NOT NULL,
        CONSTRAINT "PK_semantic_caches" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_semantic_caches_question_id"
        ON "semantic_caches" ("question_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_semantic_caches_embedding_hnsw"
        ON "semantic_caches"
        USING hnsw ("query_embedding" vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_semantic_caches_embedding_hnsw"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_semantic_caches_question_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "semantic_caches"`);
  }
}
