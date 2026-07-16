import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryIdToTestSuites1781000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE test_suites ADD COLUMN IF NOT EXISTS "categoryId" uuid`,
    );
    await queryRunner.query(
      `UPDATE test_suites SET "categoryId" = (SELECT id FROM categories WHERE name = 'JHS' LIMIT 1) WHERE title ILIKE '%jhs%'`,
    );
    await queryRunner.query(
      `UPDATE test_suites SET "categoryId" = (SELECT id FROM categories WHERE name = 'SHS' LIMIT 1) WHERE title ILIKE '%shs%'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE test_suites DROP COLUMN IF EXISTS "categoryId"`,
    );
  }
}
