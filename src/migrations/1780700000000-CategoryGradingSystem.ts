import { MigrationInterface, QueryRunner } from 'typeorm';

export class CategoryGradingSystem1780700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "categories_grading_system_enum" AS ENUM('WASSCE', 'BECE', 'NONE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$`,
    );
    await queryRunner.query(
      `ALTER TABLE categories ADD COLUMN IF NOT EXISTS grading_system "categories_grading_system_enum" NOT NULL DEFAULT 'NONE'`,
    );
    await queryRunner.query(
      `UPDATE categories SET grading_system = 'WASSCE' WHERE name ILIKE '%wassce%' OR name ILIKE '%waec%'`,
    );
    await queryRunner.query(
      `UPDATE categories SET grading_system = 'BECE' WHERE name ILIKE '%bece%'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE categories DROP COLUMN IF EXISTS grading_system`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "categories_grading_system_enum"`);
  }
}
