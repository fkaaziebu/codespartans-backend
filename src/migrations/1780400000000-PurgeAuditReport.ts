import { MigrationInterface, QueryRunner } from 'typeorm';

export class PurgeAuditReport1780400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create deletion_audit_event enum if it doesn't exist yet
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE deletion_audit_event AS ENUM (
          'STUDENT_DELETION_REQUESTED',
          'STUDENT_DELETION_ALREADY_PENDING',
          'STUDENT_DELETION_CANCELLED',
          'STUDENT_ACCOUNT_PURGED',
          'PARENT_DELETION_REQUESTED',
          'PARENT_DELETION_ALREADY_PENDING',
          'PARENT_DELETION_CANCELLED',
          'PARENT_ACCOUNT_PURGED',
          'CHILD_DELETION_REQUESTED',
          'CHILD_DELETION_CANCELLED',
          'CHILD_CASCADE_DEACTIVATED',
          'CHILD_CASCADE_PURGED'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    // Create audit_account_type enum if it doesn't exist yet
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE audit_account_type AS ENUM ('STUDENT', 'PARENT');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    // Create deletion_audit_logs table if it doesn't exist yet
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS deletion_audit_logs (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        event deletion_audit_event NOT NULL,
        account_id varchar NOT NULL,
        account_type audit_account_type NOT NULL,
        affected_child_ids text,
        ip_address varchar,
        user_agent varchar,
        purge_report jsonb,
        occurred_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    // Add new enum values to deletion_audit_event (no-op if already present)
    await queryRunner.query(
      `ALTER TYPE deletion_audit_event ADD VALUE IF NOT EXISTS 'STUDENT_PURGE_FAILED'`,
    );
    await queryRunner.query(
      `ALTER TYPE deletion_audit_event ADD VALUE IF NOT EXISTS 'PARENT_PURGE_FAILED'`,
    );

    // Add purge_report column in case the table pre-existed without it
    await queryRunner.query(
      `ALTER TABLE deletion_audit_logs ADD COLUMN IF NOT EXISTS purge_report jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE deletion_audit_logs DROP COLUMN IF EXISTS purge_report`,
    );
    // The table and enum types are owned by InitialSchema; only the column
    // and the two new enum values (which Postgres cannot remove) belong here.
  }
}
