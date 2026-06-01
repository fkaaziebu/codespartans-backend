import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuiteTypeEnumValues1780272000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE test_suites_suite_type_enum ADD VALUE IF NOT EXISTS 'YEAR_ONE'`,
    );
    await queryRunner.query(
      `ALTER TYPE test_suites_suite_type_enum ADD VALUE IF NOT EXISTS 'YEAR_TWO'`,
    );
    await queryRunner.query(
      `ALTER TYPE test_suites_suite_type_enum ADD VALUE IF NOT EXISTS 'YEAR_THREE'`,
    );
    await queryRunner.query(
      `ALTER TYPE test_suites_suite_type_enum ADD VALUE IF NOT EXISTS 'MIXED'`,
    );
    await queryRunner.query(
      `ALTER TYPE test_suites_suite_type_enum ADD VALUE IF NOT EXISTS 'PAST_QUESTIONS'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL cannot remove enum values directly; recreate the type without them
    await queryRunner.query(
      `CREATE TYPE test_suites_suite_type_enum_old AS ENUM ('YEAR', 'MIXED', 'PAST_QUESTIONS', 'CLASS', 'TOPIC')`,
    );
    await queryRunner.query(
      `UPDATE test_suites SET suite_type = NULL WHERE suite_type IN ('YEAR_ONE', 'YEAR_TWO', 'YEAR_THREE')`,
    );
    await queryRunner.query(
      `ALTER TABLE test_suites ALTER COLUMN suite_type TYPE test_suites_suite_type_enum_old USING suite_type::text::test_suites_suite_type_enum_old`,
    );
    await queryRunner.query(`DROP TYPE test_suites_suite_type_enum`);
    await queryRunner.query(
      `ALTER TYPE test_suites_suite_type_enum_old RENAME TO test_suites_suite_type_enum`,
    );
  }
}
