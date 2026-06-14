import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountDeletion1780300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add deactivation columns to students
    await queryRunner.query(
      `ALTER TABLE students ADD COLUMN IF NOT EXISTS is_deactivated boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE students ADD COLUMN IF NOT EXISTS deactivated_at timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE students ADD COLUMN IF NOT EXISTS deletion_job_id varchar`,
    );

    // Add deactivation columns to parents
    await queryRunner.query(
      `ALTER TABLE parents ADD COLUMN IF NOT EXISTS is_deactivated boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE parents ADD COLUMN IF NOT EXISTS deactivated_at timestamptz`,
    );
    await queryRunner.query(
      `ALTER TABLE parents ADD COLUMN IF NOT EXISTS deletion_job_id varchar`,
    );

    // student_subscriptions: studentId nullable + SET NULL on delete
    await queryRunner.query(
      `ALTER TABLE student_subscriptions ALTER COLUMN "studentId" DROP NOT NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE student_subscriptions
        DROP CONSTRAINT IF EXISTS "FK_student_subscriptions_student"
    `);
    // Find and drop the existing FK by querying pg catalog, then recreate
    await queryRunner.query(`
      DO $$
      DECLARE fk_name text;
      BEGIN
        SELECT tc.constraint_name INTO fk_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'student_subscriptions'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'studentId'
        LIMIT 1;

        IF fk_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE student_subscriptions DROP CONSTRAINT "' || fk_name || '"';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE student_subscriptions
        ADD CONSTRAINT "FK_student_subscriptions_student"
        FOREIGN KEY ("studentId") REFERENCES students(id) ON DELETE SET NULL
    `);

    // parent_subscriptions: parentId nullable + SET NULL on delete
    await queryRunner.query(
      `ALTER TABLE parent_subscriptions ALTER COLUMN "parentId" DROP NOT NULL`,
    );
    // Drop the named FK added by InitialSchema (if it exists) before the DO block so
    // that LIMIT 1 below doesn't pick the auto-generated FK while leaving this one.
    await queryRunner.query(`
      ALTER TABLE parent_subscriptions
        DROP CONSTRAINT IF EXISTS "FK_parent_subscriptions_parent"
    `);
    await queryRunner.query(`
      DO $$
      DECLARE fk_name text;
      BEGIN
        SELECT tc.constraint_name INTO fk_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'parent_subscriptions'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'parentId'
        LIMIT 1;

        IF fk_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE parent_subscriptions DROP CONSTRAINT "' || fk_name || '"';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE parent_subscriptions
        ADD CONSTRAINT "FK_parent_subscriptions_parent"
        FOREIGN KEY ("parentId") REFERENCES parents(id) ON DELETE SET NULL
    `);

    // tests: studentId nullable + SET NULL on delete
    await queryRunner.query(
      `ALTER TABLE tests ALTER COLUMN "studentId" DROP NOT NULL`,
    );
    // Drop the named FK added by InitialSchema before the DO block.
    await queryRunner.query(`
      ALTER TABLE tests DROP CONSTRAINT IF EXISTS "FK_tests_student"
    `);
    await queryRunner.query(`
      DO $$
      DECLARE fk_name text;
      BEGIN
        SELECT tc.constraint_name INTO fk_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'tests'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'studentId'
        LIMIT 1;

        IF fk_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE tests DROP CONSTRAINT "' || fk_name || '"';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE tests
        ADD CONSTRAINT "FK_tests_student"
        FOREIGN KEY ("studentId") REFERENCES students(id) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert tests FK
    await queryRunner.query(
      `ALTER TABLE tests DROP CONSTRAINT IF EXISTS "FK_tests_student"`,
    );
    await queryRunner.query(
      `ALTER TABLE tests ALTER COLUMN "studentId" SET NOT NULL`,
    );

    // Revert parent_subscriptions FK
    await queryRunner.query(
      `ALTER TABLE parent_subscriptions DROP CONSTRAINT IF EXISTS "FK_parent_subscriptions_parent"`,
    );
    await queryRunner.query(
      `ALTER TABLE parent_subscriptions ALTER COLUMN "parentId" SET NOT NULL`,
    );

    // Revert student_subscriptions FK
    await queryRunner.query(
      `ALTER TABLE student_subscriptions DROP CONSTRAINT IF EXISTS "FK_student_subscriptions_student"`,
    );
    await queryRunner.query(
      `ALTER TABLE student_subscriptions ALTER COLUMN "studentId" SET NOT NULL`,
    );

    // Remove deactivation columns from parents
    await queryRunner.query(
      `ALTER TABLE parents DROP COLUMN IF EXISTS deletion_job_id`,
    );
    await queryRunner.query(
      `ALTER TABLE parents DROP COLUMN IF EXISTS deactivated_at`,
    );
    await queryRunner.query(
      `ALTER TABLE parents DROP COLUMN IF EXISTS is_deactivated`,
    );

    // Remove deactivation columns from students
    await queryRunner.query(
      `ALTER TABLE students DROP COLUMN IF EXISTS deletion_job_id`,
    );
    await queryRunner.query(
      `ALTER TABLE students DROP COLUMN IF EXISTS deactivated_at`,
    );
    await queryRunner.query(
      `ALTER TABLE students DROP COLUMN IF EXISTS is_deactivated`,
    );
  }
}
