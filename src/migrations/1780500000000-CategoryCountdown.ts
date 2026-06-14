import { MigrationInterface, QueryRunner } from 'typeorm';

export class CategoryCountdown1780500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE categories ADD COLUMN IF NOT EXISTS date_of_exams date`,
    );
    await queryRunner.query(
      `ALTER TABLE categories ADD COLUMN IF NOT EXISTS exam_duration_days integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE categories DROP COLUMN IF EXISTS exam_duration_days`,
    );
    await queryRunner.query(
      `ALTER TABLE categories DROP COLUMN IF EXISTS date_of_exams`,
    );
  }
}
