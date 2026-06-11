import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1749600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure uuid generation is available
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ─── ENUM TYPES ──────────────────────────────────────────────────────────

    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "parents_gender_enum" AS ENUM ('Male', 'Female');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "children_class_level_enum" AS ENUM ('JHS1', 'JHS2', 'JHS3', 'SHS1', 'SHS2', 'SHS3');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "school_students_class_level_enum" AS ENUM ('JHS1', 'JHS2', 'JHS3', 'SHS1', 'SHS2', 'SHS3');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "admins_status_enum" AS ENUM ('ACTIVE', 'INACTIVE');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "instructors_status_enum" AS ENUM ('ACTIVE', 'INACTIVE');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "subscription_plans_interval_enum" AS ENUM ('monthly', 'quarterly', 'yearly');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "organization_subscriptions_status_enum" AS ENUM ('active', 'expired', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "student_subscriptions_status_enum" AS ENUM ('active', 'expired', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "parent_subscriptions_status_enum" AS ENUM ('active', 'expired', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "school_demos_role_enum" AS ENUM ('proprietor_owner', 'headmaster_principal', 'academic_director', 'teacher', 'other');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "school_demos_approximate_students_enum" AS ENUM ('under_50', '50_to_100', '100_to_300', '300_to_500', 'above_500');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "school_demos_status_enum" AS ENUM ('pending', 'active', 'expired', 'converted');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "student_demo_requests_status_enum" AS ENUM ('pending', 'active', 'expired', 'converted');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "parent_demo_requests_status_enum" AS ENUM ('pending', 'active', 'expired', 'converted');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "courses_domains_enum" AS ENUM ('SCIENCE', 'ENGLISH', 'MATHEMATICS');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "courses_level_enum" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "courses_currency_enum" AS ENUM ('USD', 'EUR');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "versions_status_enum" AS ENUM ('ARCHIVED', 'PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "test_suites_difficulty_enum" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    // NOTE: AddSuiteTypeEnumValues migration adds YEAR_ONE, YEAR_TWO, YEAR_THREE on top of this
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "test_suites_suite_type_enum" AS ENUM ('YEAR', 'MIXED', 'PAST_QUESTIONS', 'CLASS', 'TOPIC');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "questions_type_enum" AS ENUM ('MULTIPLE_CHOICE', 'MULTIPLE_SELECT', 'FILL_IN', 'SHORT_ANSWER');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "questions_tags_enum" AS ENUM (
          'TAG_GENERAL',
          'TAG_NUMBER_AND_NUMERATION', 'TAG_ALGEBRA', 'TAG_GEOMETRY', 'TAG_MENSURATION',
          'TAG_STATISTICS_AND_PROBABILITY', 'TAG_TRIGONOMETRY', 'TAG_CALCULUS',
          'TAG_VECTORS_AND_MATRICES', 'TAG_SETS',
          'TAG_READING_COMPREHENSION', 'TAG_SUMMARY_WRITING', 'TAG_ESSAY_WRITING',
          'TAG_GRAMMAR_AND_USAGE', 'TAG_VOCABULARY', 'TAG_ORAL_ENGLISH',
          'TAG_PHYSICAL_PROCESSES', 'TAG_LIFE_PROCESSES', 'TAG_EARTH_AND_SPACE',
          'TAG_DIVERSITY_OF_MATTER',
          'TAG_GHANA_HISTORY', 'TAG_GOVERNMENT_AND_CITIZENSHIP', 'TAG_ECONOMIC_DEVELOPMENT',
          'TAG_POPULATION_AND_DEVELOPMENT', 'TAG_ENVIRONMENT_AND_SOCIETY', 'TAG_CULTURE_AND_VALUES',
          'TAG_MECHANICS', 'TAG_WAVES_AND_OPTICS', 'TAG_ELECTRICITY_AND_MAGNETISM',
          'TAG_HEAT_AND_THERMODYNAMICS', 'TAG_ATOMIC_AND_NUCLEAR_PHYSICS', 'TAG_MEASUREMENT',
          'TAG_ATOMIC_STRUCTURE', 'TAG_CHEMICAL_BONDING', 'TAG_STOICHIOMETRY',
          'TAG_ORGANIC_CHEMISTRY', 'TAG_ACIDS_BASES_AND_SALTS', 'TAG_ELECTROCHEMISTRY',
          'TAG_PERIODIC_TABLE', 'TAG_AIR_AND_WATER',
          'TAG_CELL_BIOLOGY', 'TAG_GENETICS_AND_EVOLUTION', 'TAG_ECOLOGY',
          'TAG_HUMAN_PHYSIOLOGY', 'TAG_PLANT_BIOLOGY', 'TAG_MICROORGANISMS_AND_DISEASE',
          'TAG_CLASSIFICATION',
          'TAG_DEMAND_AND_SUPPLY', 'TAG_PRODUCTION_AND_COSTS', 'TAG_NATIONAL_INCOME',
          'TAG_MONEY_AND_BANKING', 'TAG_INTERNATIONAL_TRADE', 'TAG_PUBLIC_FINANCE',
          'TAG_MAP_READING', 'TAG_PHYSICAL_GEOGRAPHY', 'TAG_HUMAN_GEOGRAPHY',
          'TAG_REGIONAL_GEOGRAPHY', 'TAG_ECONOMIC_GEOGRAPHY',
          'TAG_PRECOLONIAL_AFRICA', 'TAG_COLONIAL_PERIOD', 'TAG_INDEPENDENCE_MOVEMENTS',
          'TAG_GHANA_POLITICAL_HISTORY', 'TAG_CONSTITUTION_AND_LAW', 'TAG_DEMOCRATIC_INSTITUTIONS',
          'TAG_PROSE', 'TAG_POETRY', 'TAG_DRAMA',
          'TAG_COMPUTER_HARDWARE', 'TAG_SOFTWARE_AND_APPLICATIONS', 'TAG_INTERNET_AND_NETWORKING',
          'TAG_PROGRAMMING_BASICS', 'TAG_DATA_MANAGEMENT',
          'TAG_FRENCH_GRAMMAR', 'TAG_FRENCH_VOCABULARY', 'TAG_FRENCH_COMPREHENSION',
          'TAG_CHRISTIANITY', 'TAG_ISLAM', 'TAG_AFRICAN_TRADITIONAL_RELIGION'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "questions_difficulty_enum" AS ENUM ('EASY', 'MEDIUM', 'HARD');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "questions_class_level_enum" AS ENUM ('jhs_1', 'jhs_2', 'jhs_3', 'shs_1', 'shs_2', 'shs_3');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "reviews_status_enum" AS ENUM ('OPEN', 'CLOSED');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "issues_status_enum" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "tests_status_enum" AS ENUM ('ON_GOING', 'PAUSED', 'ENDED');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "tests_mode_enum" AS ENUM ('PROCTURED', 'UN_PROCTURED');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "test_assignments_status_enum" AS ENUM ('PENDING', 'COMPLETED');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "time_events_type_enum" AS ENUM ('STARTED', 'PAUSED', 'RESUMED', 'ENDED');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    // ─── TABLES (dependency order) ────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "images" (
        "id"            uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "path"          varchar     NOT NULL,
        "original_name" varchar     NOT NULL,
        "mime_type"     varchar     NOT NULL,
        "buffer"        bytea,
        CONSTRAINT "UQ_images_path" UNIQUE ("path"),
        CONSTRAINT "PK_images" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscription_plans" (
        "id"            uuid                                NOT NULL DEFAULT uuid_generate_v4(),
        "plan_key"      varchar                             NOT NULL,
        "name"          varchar                             NOT NULL,
        "tagline"       varchar,
        "description"   varchar,
        "price"         double precision                    NOT NULL,
        "currency"      varchar                             NOT NULL DEFAULT 'GHS',
        "interval"      "subscription_plans_interval_enum" NOT NULL,
        "duration_days" integer                             NOT NULL,
        "features"      json                                NOT NULL DEFAULT '[]',
        "billing_label" varchar,
        "max_students"  integer,
        "is_custom"     boolean                             NOT NULL DEFAULT false,
        "is_active"     boolean                             NOT NULL DEFAULT true,
        "created_at"    timestamptz                         NOT NULL DEFAULT now(),
        "updated_at"    timestamptz                         NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_subscription_plans_plan_key" UNIQUE ("plan_key"),
        CONSTRAINT "PK_subscription_plans" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "school_demos" (
        "id"                   uuid                                      NOT NULL DEFAULT uuid_generate_v4(),
        "name"                 varchar                                   NOT NULL,
        "school_name"          varchar                                   NOT NULL,
        "role"                 "school_demos_role_enum"                  NOT NULL,
        "approximate_students" "school_demos_approximate_students_enum"  NOT NULL,
        "email"                varchar                                   NOT NULL,
        "whatsapp_number"      varchar                                   NOT NULL,
        "demo_code"            varchar                                   NOT NULL,
        "status"               "school_demos_status_enum"                NOT NULL DEFAULT 'pending',
        "activated_at"         timestamptz,
        "expires_at"           timestamptz,
        "trial_duration_days"  integer                                   NOT NULL DEFAULT 14,
        "created_at"           timestamptz                               NOT NULL DEFAULT now(),
        "updated_at"           timestamptz                               NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_school_demos_email"     UNIQUE ("email"),
        CONSTRAINT "UQ_school_demos_demo_code" UNIQUE ("demo_code"),
        CONSTRAINT "PK_school_demos" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "student_demo_requests" (
        "id"                   uuid                                        NOT NULL DEFAULT uuid_generate_v4(),
        "full_name"            varchar                                     NOT NULL,
        "email"                varchar                                     NOT NULL,
        "demo_code"            varchar                                     NOT NULL,
        "target_exam"          varchar                                     NOT NULL,
        "status"               "student_demo_requests_status_enum"         NOT NULL DEFAULT 'pending',
        "activated_at"         timestamptz,
        "expires_at"           timestamptz,
        "trial_duration_days"  integer                                     NOT NULL DEFAULT 14,
        "created_at"           timestamptz                                 NOT NULL DEFAULT now(),
        "updated_at"           timestamptz                                 NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_student_demo_requests_email"     UNIQUE ("email"),
        CONSTRAINT "UQ_student_demo_requests_demo_code" UNIQUE ("demo_code"),
        CONSTRAINT "PK_student_demo_requests" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "parent_demo_requests" (
        "id"                   uuid                                       NOT NULL DEFAULT uuid_generate_v4(),
        "full_name"            varchar                                    NOT NULL,
        "email"                varchar                                    NOT NULL,
        "demo_code"            varchar                                    NOT NULL,
        "target_exams"         text[]                                     NOT NULL,
        "status"               "parent_demo_requests_status_enum"         NOT NULL DEFAULT 'pending',
        "activated_at"         timestamptz,
        "expires_at"           timestamptz,
        "trial_duration_days"  integer                                    NOT NULL DEFAULT 14,
        "created_at"           timestamptz                                NOT NULL DEFAULT now(),
        "updated_at"           timestamptz                                NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_parent_demo_requests_email"     UNIQUE ("email"),
        CONSTRAINT "UQ_parent_demo_requests_demo_code" UNIQUE ("demo_code"),
        CONSTRAINT "PK_parent_demo_requests" PRIMARY KEY ("id")
      )
    `);

    // carts has no FK columns (the FK lives on students.cartId)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "carts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        CONSTRAINT "PK_carts" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "instructors" (
        "id"       uuid                         NOT NULL DEFAULT uuid_generate_v4(),
        "name"     varchar                      NOT NULL,
        "email"    varchar                      NOT NULL,
        "password" varchar                      NOT NULL,
        "status"   "instructors_status_enum"    NOT NULL DEFAULT 'ACTIVE',
        CONSTRAINT "UQ_instructors_email" UNIQUE ("email"),
        CONSTRAINT "PK_instructors" PRIMARY KEY ("id")
      )
    `);

    // NOTE: AccountDeletion migration adds is_deactivated / deactivated_at / deletion_job_id later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "parents" (
        "id"                    uuid                    NOT NULL DEFAULT uuid_generate_v4(),
        "first_name"            varchar                 NOT NULL,
        "last_name"             varchar                 NOT NULL,
        "email"                 varchar                 NOT NULL,
        "whatsapp_number"       varchar,
        "gender"                "parents_gender_enum"   NOT NULL DEFAULT 'Male',
        "password"              varchar                 NOT NULL,
        "is_account_validated"  boolean                 NOT NULL DEFAULT false,
        "is_setup_completed"    boolean                 NOT NULL DEFAULT false,
        "validation_code"       varchar,
        "reset_token"           varchar,
        CONSTRAINT "UQ_parents_email" UNIQUE ("email"),
        CONSTRAINT "PK_parents" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "organizations" (
        "id"           uuid    NOT NULL DEFAULT uuid_generate_v4(),
        "name"         varchar NOT NULL,
        "email"        varchar NOT NULL,
        "password"     varchar NOT NULL,
        "schoolDemoId" uuid,
        CONSTRAINT "UQ_organizations_email"      UNIQUE ("email"),
        CONSTRAINT "REL_organizations_schoolDemo" UNIQUE ("schoolDemoId"),
        CONSTRAINT "PK_organizations" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "organizations" ADD CONSTRAINT "FK_organizations_schoolDemo"
        FOREIGN KEY ("schoolDemoId") REFERENCES "school_demos"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admins" (
        "id"             uuid                    NOT NULL DEFAULT uuid_generate_v4(),
        "name"           varchar                 NOT NULL,
        "email"          varchar                 NOT NULL,
        "password"       varchar                 NOT NULL,
        "status"         "admins_status_enum"    NOT NULL DEFAULT 'ACTIVE',
        "organizationId" uuid,
        CONSTRAINT "UQ_admins_email" UNIQUE ("email"),
        CONSTRAINT "PK_admins" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "admins" ADD CONSTRAINT "FK_admins_organization"
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // NOTE: AccountDeletion migration adds is_deactivated / deactivated_at / deletion_job_id later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "students" (
        "id"                   uuid    NOT NULL DEFAULT uuid_generate_v4(),
        "name"                 varchar NOT NULL,
        "email"                varchar NOT NULL,
        "password"             varchar NOT NULL,
        "reset_token"          varchar,
        "is_setup_completed"   boolean NOT NULL DEFAULT false,
        "is_account_validated" boolean NOT NULL DEFAULT false,
        "validation_code"      varchar,
        "cartId"               uuid,
        CONSTRAINT "UQ_students_email" UNIQUE ("email"),
        CONSTRAINT "REL_students_cart" UNIQUE ("cartId"),
        CONSTRAINT "PK_students" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "students" ADD CONSTRAINT "FK_students_cart"
        FOREIGN KEY ("cartId") REFERENCES "carts"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id"             uuid    NOT NULL DEFAULT uuid_generate_v4(),
        "name"           varchar NOT NULL,
        "avatar_url"     varchar NOT NULL,
        "organizationId" uuid,
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "categories" ADD CONSTRAINT "FK_categories_organization"
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "coupons" (
        "id"             uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organizationId" uuid,
        CONSTRAINT "PK_coupons" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "coupons" ADD CONSTRAINT "FK_coupons_organization"
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // approved_versionId FK is added after versions table is created (circular dep)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "courses" (
        "id"                  uuid                     NOT NULL DEFAULT uuid_generate_v4(),
        "title"               varchar                  NOT NULL,
        "avatar_url"          varchar                  NOT NULL,
        "description"         varchar                  NOT NULL,
        "is_mandatory"        boolean                  NOT NULL DEFAULT false,
        "domains"             "courses_domains_enum"[] NOT NULL DEFAULT '{SCIENCE}',
        "level"               "courses_level_enum"     NOT NULL DEFAULT 'BEGINNER',
        "price"               double precision         NOT NULL,
        "currency"            "courses_currency_enum"  NOT NULL DEFAULT 'USD',
        "approved_versionId"  uuid,
        "organizationId"      uuid,
        "instructorId"        uuid,
        "inserted_at"         timestamp               NOT NULL DEFAULT now(),
        "updated_at"          timestamp               NOT NULL DEFAULT now(),
        CONSTRAINT "REL_courses_approvedVersion" UNIQUE ("approved_versionId"),
        CONSTRAINT "PK_courses" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_organization"
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_instructor"
        FOREIGN KEY ("instructorId") REFERENCES "instructors"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "children" (
        "id"          uuid                         NOT NULL DEFAULT uuid_generate_v4(),
        "full_name"   varchar                      NOT NULL,
        "class_level" "children_class_level_enum"  NOT NULL,
        "target_exam" uuid                         NOT NULL,
        "school_name" varchar,
        "username"    varchar,
        "pin"         varchar                      NOT NULL,
        "parentId"    uuid,
        "studentId"   uuid,
        CONSTRAINT "UQ_children_username"   UNIQUE ("username"),
        CONSTRAINT "REL_children_student"   UNIQUE ("studentId"),
        CONSTRAINT "PK_children" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "children" ADD CONSTRAINT "FK_children_parent"
        FOREIGN KEY ("parentId") REFERENCES "parents"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "children" ADD CONSTRAINT "FK_children_student"
        FOREIGN KEY ("studentId") REFERENCES "students"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "school_students" (
        "id"             uuid                                  NOT NULL DEFAULT uuid_generate_v4(),
        "full_name"      varchar                               NOT NULL,
        "class_level"    "school_students_class_level_enum"    NOT NULL,
        "target_exam"    uuid                                  NOT NULL,
        "username"       varchar,
        "pin"            varchar                               NOT NULL,
        "organizationId" uuid,
        "studentId"      uuid,
        CONSTRAINT "UQ_school_students_username" UNIQUE ("username"),
        CONSTRAINT "REL_school_students_student" UNIQUE ("studentId"),
        CONSTRAINT "PK_school_students" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "school_students" ADD CONSTRAINT "FK_school_students_organization"
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "school_students" ADD CONSTRAINT "FK_school_students_student"
        FOREIGN KEY ("studentId") REFERENCES "students"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "checkouts" (
        "id"        uuid NOT NULL DEFAULT uuid_generate_v4(),
        "studentId" uuid,
        CONSTRAINT "PK_checkouts" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "checkouts" ADD CONSTRAINT "FK_checkouts_student"
        FOREIGN KEY ("studentId") REFERENCES "students"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "organization_subscriptions" (
        "id"                   uuid                                         NOT NULL DEFAULT uuid_generate_v4(),
        "paystack_reference"   varchar,
        "status"               "organization_subscriptions_status_enum"     NOT NULL DEFAULT 'active',
        "started_at"           timestamptz                                  NOT NULL,
        "expires_at"           timestamptz                                  NOT NULL,
        "created_at"           timestamptz                                  NOT NULL DEFAULT now(),
        "updated_at"           timestamptz                                  NOT NULL DEFAULT now(),
        "organizationId"       uuid,
        "planId"               uuid,
        CONSTRAINT "UQ_org_subscriptions_paystack_ref" UNIQUE ("paystack_reference"),
        CONSTRAINT "PK_organization_subscriptions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "organization_subscriptions" ADD CONSTRAINT "FK_org_subscriptions_organization"
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "organization_subscriptions" ADD CONSTRAINT "FK_org_subscriptions_plan"
        FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // NOTE: AccountDeletion migration makes studentId nullable and adds SET NULL later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "student_subscriptions" (
        "id"                 uuid                                    NOT NULL DEFAULT uuid_generate_v4(),
        "paystack_reference" varchar,
        "status"             "student_subscriptions_status_enum"     NOT NULL DEFAULT 'active',
        "started_at"         timestamptz                             NOT NULL,
        "expires_at"         timestamptz                             NOT NULL,
        "created_at"         timestamptz                             NOT NULL DEFAULT now(),
        "updated_at"         timestamptz                             NOT NULL DEFAULT now(),
        "studentId"          uuid,
        "planId"             uuid,
        CONSTRAINT "UQ_student_subscriptions_paystack_ref" UNIQUE ("paystack_reference"),
        CONSTRAINT "PK_student_subscriptions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "student_subscriptions" ADD CONSTRAINT "FK_student_subscriptions_student"
        FOREIGN KEY ("studentId") REFERENCES "students"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "student_subscriptions" ADD CONSTRAINT "FK_student_subscriptions_plan"
        FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // NOTE: AccountDeletion migration makes parentId nullable and adds SET NULL later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "parent_subscriptions" (
        "id"                 uuid                                   NOT NULL DEFAULT uuid_generate_v4(),
        "paystack_reference" varchar,
        "status"             "parent_subscriptions_status_enum"     NOT NULL DEFAULT 'active',
        "started_at"         timestamptz                            NOT NULL,
        "expires_at"         timestamptz                            NOT NULL,
        "created_at"         timestamptz                            NOT NULL DEFAULT now(),
        "updated_at"         timestamptz                            NOT NULL DEFAULT now(),
        "parentId"           uuid,
        "planId"             uuid,
        CONSTRAINT "UQ_parent_subscriptions_paystack_ref" UNIQUE ("paystack_reference"),
        CONSTRAINT "PK_parent_subscriptions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "parent_subscriptions" ADD CONSTRAINT "FK_parent_subscriptions_parent"
        FOREIGN KEY ("parentId") REFERENCES "parents"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "parent_subscriptions" ADD CONSTRAINT "FK_parent_subscriptions_plan"
        FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "versions" (
        "id"              uuid                    NOT NULL DEFAULT uuid_generate_v4(),
        "version_number"  integer                 NOT NULL,
        "status"          "versions_status_enum"  NOT NULL DEFAULT 'PENDING',
        "courseId"        uuid,
        "assignedAdminId" uuid,
        "inserted_at"     timestamp               NOT NULL DEFAULT now(),
        "updated_at"      timestamp               NOT NULL DEFAULT now(),
        CONSTRAINT "PK_versions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "versions" ADD CONSTRAINT "FK_versions_course"
        FOREIGN KEY ("courseId") REFERENCES "courses"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "versions" ADD CONSTRAINT "FK_versions_assignedAdmin"
        FOREIGN KEY ("assignedAdminId") REFERENCES "admins"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Resolve courses ↔ versions circular dependency
    await queryRunner.query(`
      ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_approvedVersion"
        FOREIGN KEY ("approved_versionId") REFERENCES "versions"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "review_requests" (
        "id"              uuid      NOT NULL DEFAULT uuid_generate_v4(),
        "organizationId"  uuid,
        "courseVersionId" uuid,
        "inserted_at"     timestamp NOT NULL DEFAULT now(),
        "updated_at"      timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "REL_review_requests_courseVersion" UNIQUE ("courseVersionId"),
        CONSTRAINT "PK_review_requests" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "review_requests" ADD CONSTRAINT "FK_review_requests_organization"
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "review_requests" ADD CONSTRAINT "FK_review_requests_courseVersion"
        FOREIGN KEY ("courseVersionId") REFERENCES "versions"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "test_suites" (
        "id"              uuid                          NOT NULL DEFAULT uuid_generate_v4(),
        "title"           varchar,
        "description"     varchar,
        "keywords"        text[],
        "difficulty"      "test_suites_difficulty_enum" NOT NULL DEFAULT 'BEGINNER',
        "suite_type"      "test_suites_suite_type_enum",
        "image_url"       varchar,
        "courseVersionId" uuid,
        CONSTRAINT "PK_test_suites" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "test_suites" ADD CONSTRAINT "FK_test_suites_courseVersion"
        FOREIGN KEY ("courseVersionId") REFERENCES "versions"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reviews" (
        "id"              uuid                   NOT NULL DEFAULT uuid_generate_v4(),
        "title"           varchar                NOT NULL,
        "message"         varchar                NOT NULL,
        "status"          "reviews_status_enum"  NOT NULL DEFAULT 'OPEN',
        "courseVersionId" uuid,
        "inserted_at"     timestamp              NOT NULL DEFAULT now(),
        "updated_at"      timestamp              NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_courseVersion"
        FOREIGN KEY ("courseVersionId") REFERENCES "versions"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "questions" (
        "id"                  uuid                        NOT NULL DEFAULT uuid_generate_v4(),
        "question_number"     integer                     NOT NULL,
        "description"         varchar                     NOT NULL,
        "hints"               text[]                      NOT NULL,
        "solution_steps"      text[]                      NOT NULL,
        "options"             text[],
        "type"                "questions_type_enum"       NOT NULL DEFAULT 'MULTIPLE_CHOICE',
        "tags"                "questions_tags_enum"[]     NOT NULL DEFAULT '{TAG_GENERAL}',
        "correct_answer"      varchar                     NOT NULL,
        "difficulty"          "questions_difficulty_enum" NOT NULL DEFAULT 'EASY',
        "estimated_time_in_ms" integer                   NOT NULL,
        "class_level"         "questions_class_level_enum",
        "exam_year"           integer,
        "marks"               integer                     NOT NULL DEFAULT 1,
        "versionId"           uuid,
        "testSuiteId"         uuid,
        CONSTRAINT "PK_questions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "questions" ADD CONSTRAINT "FK_questions_version"
        FOREIGN KEY ("versionId") REFERENCES "versions"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "questions" ADD CONSTRAINT "FK_questions_testSuite"
        FOREIGN KEY ("testSuiteId") REFERENCES "test_suites"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // NOTE: AccountDeletion migration makes studentId nullable and adds SET NULL later
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tests" (
        "id"          uuid                 NOT NULL DEFAULT uuid_generate_v4(),
        "status"      "tests_status_enum"  NOT NULL DEFAULT 'ON_GOING',
        "mode"        "tests_mode_enum"    NOT NULL DEFAULT 'PROCTURED',
        "testSuiteId" uuid,
        "studentId"   uuid,
        CONSTRAINT "PK_tests" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "tests" ADD CONSTRAINT "FK_tests_testSuite"
        FOREIGN KEY ("testSuiteId") REFERENCES "test_suites"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "tests" ADD CONSTRAINT "FK_tests_student"
        FOREIGN KEY ("studentId") REFERENCES "students"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "test_assignments" (
        "id"           uuid                          NOT NULL DEFAULT uuid_generate_v4(),
        "status"       "test_assignments_status_enum" NOT NULL DEFAULT 'PENDING',
        "assigned_at"  timestamp                     NOT NULL DEFAULT now(),
        "completed_at" timestamp,
        "note"         text,
        "parentId"     uuid,
        "childId"      uuid,
        "testSuiteId"  uuid,
        "testId"       uuid,
        CONSTRAINT "REL_test_assignments_test" UNIQUE ("testId"),
        CONSTRAINT "PK_test_assignments" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "test_assignments" ADD CONSTRAINT "FK_test_assignments_parent"
        FOREIGN KEY ("parentId") REFERENCES "parents"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "test_assignments" ADD CONSTRAINT "FK_test_assignments_child"
        FOREIGN KEY ("childId") REFERENCES "children"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "test_assignments" ADD CONSTRAINT "FK_test_assignments_testSuite"
        FOREIGN KEY ("testSuiteId") REFERENCES "test_suites"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "test_assignments" ADD CONSTRAINT "FK_test_assignments_test"
        FOREIGN KEY ("testId") REFERENCES "tests"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "submitted_answers" (
        "id"              uuid    NOT NULL DEFAULT uuid_generate_v4(),
        "question_id"     uuid    NOT NULL,
        "answer_provided" varchar NOT NULL,
        "hints_used"      text[]  NOT NULL DEFAULT '{}',
        "is_flagged"      boolean NOT NULL DEFAULT false,
        "is_correct"      boolean DEFAULT NULL,
        "is_marked"       boolean NOT NULL DEFAULT false,
        "time_ranges"     text[]  NOT NULL,
        "questionId"      uuid,
        "testId"          uuid,
        CONSTRAINT "PK_submitted_answers" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "submitted_answers" ADD CONSTRAINT "FK_submitted_answers_question"
        FOREIGN KEY ("questionId") REFERENCES "questions"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "submitted_answers" ADD CONSTRAINT "FK_submitted_answers_test"
        FOREIGN KEY ("testId") REFERENCES "tests"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "time_events" (
        "id"          uuid                    NOT NULL DEFAULT uuid_generate_v4(),
        "type"        "time_events_type_enum" NOT NULL DEFAULT 'STARTED',
        "recorded_at" timestamp               NOT NULL,
        "testId"      uuid,
        CONSTRAINT "PK_time_events" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "time_events" ADD CONSTRAINT "FK_time_events_test"
        FOREIGN KEY ("testId") REFERENCES "tests"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "recommendations" (
        "id"          uuid    NOT NULL DEFAULT uuid_generate_v4(),
        "description" varchar NOT NULL,
        "testId"      uuid,
        CONSTRAINT "PK_recommendations" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "recommendations" ADD CONSTRAINT "FK_recommendations_test"
        FOREIGN KEY ("testId") REFERENCES "tests"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "issues" (
        "id"          uuid                  NOT NULL DEFAULT uuid_generate_v4(),
        "description" varchar               NOT NULL,
        "status"      "issues_status_enum"  NOT NULL DEFAULT 'OPEN',
        "response"    varchar               DEFAULT NULL,
        "reviewId"    uuid,
        CONSTRAINT "PK_issues" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "issues" ADD CONSTRAINT "FK_issues_review"
        FOREIGN KEY ("reviewId") REFERENCES "reviews"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // ─── JOIN TABLES ──────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "students_subscribed_courses_courses" (
        "studentsId" uuid NOT NULL,
        "coursesId"  uuid NOT NULL,
        CONSTRAINT "PK_students_subscribed_courses_courses" PRIMARY KEY ("studentsId", "coursesId")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ssc_studentsId" ON "students_subscribed_courses_courses" ("studentsId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ssc_coursesId"  ON "students_subscribed_courses_courses" ("coursesId")`);
    await queryRunner.query(`
      ALTER TABLE "students_subscribed_courses_courses"
        ADD CONSTRAINT "FK_ssc_student" FOREIGN KEY ("studentsId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT "FK_ssc_course"  FOREIGN KEY ("coursesId")  REFERENCES "courses"("id")  ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "students_subscribed_categories_categories" (
        "studentsId"    uuid NOT NULL,
        "categoriesId"  uuid NOT NULL,
        CONSTRAINT "PK_students_subscribed_categories_categories" PRIMARY KEY ("studentsId", "categoriesId")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sscat_studentsId"   ON "students_subscribed_categories_categories" ("studentsId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sscat_categoriesId" ON "students_subscribed_categories_categories" ("categoriesId")`);
    await queryRunner.query(`
      ALTER TABLE "students_subscribed_categories_categories"
        ADD CONSTRAINT "FK_sscat_student"   FOREIGN KEY ("studentsId")   REFERENCES "students"("id")   ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT "FK_sscat_category"  FOREIGN KEY ("categoriesId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "students_organizations_organizations" (
        "studentsId"       uuid NOT NULL,
        "organizationsId"  uuid NOT NULL,
        CONSTRAINT "PK_students_organizations_organizations" PRIMARY KEY ("studentsId", "organizationsId")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_so_studentsId"      ON "students_organizations_organizations" ("studentsId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_so_organizationsId" ON "students_organizations_organizations" ("organizationsId")`);
    await queryRunner.query(`
      ALTER TABLE "students_organizations_organizations"
        ADD CONSTRAINT "FK_so_student"      FOREIGN KEY ("studentsId")      REFERENCES "students"("id")      ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT "FK_so_organization" FOREIGN KEY ("organizationsId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "instructors_organizations_organizations" (
        "instructorsId"   uuid NOT NULL,
        "organizationsId" uuid NOT NULL,
        CONSTRAINT "PK_instructors_organizations_organizations" PRIMARY KEY ("instructorsId", "organizationsId")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_io_instructorsId"   ON "instructors_organizations_organizations" ("instructorsId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_io_organizationsId" ON "instructors_organizations_organizations" ("organizationsId")`);
    await queryRunner.query(`
      ALTER TABLE "instructors_organizations_organizations"
        ADD CONSTRAINT "FK_io_instructor"   FOREIGN KEY ("instructorsId")   REFERENCES "instructors"("id")   ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT "FK_io_organization" FOREIGN KEY ("organizationsId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories_courses_courses" (
        "categoriesId" uuid NOT NULL,
        "coursesId"    uuid NOT NULL,
        CONSTRAINT "PK_categories_courses_courses" PRIMARY KEY ("categoriesId", "coursesId")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cc_categoriesId" ON "categories_courses_courses" ("categoriesId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cc_coursesId"    ON "categories_courses_courses" ("coursesId")`);
    await queryRunner.query(`
      ALTER TABLE "categories_courses_courses"
        ADD CONSTRAINT "FK_cc_category" FOREIGN KEY ("categoriesId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT "FK_cc_course"   FOREIGN KEY ("coursesId")    REFERENCES "courses"("id")    ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "courses_coupons_coupons" (
        "coursesId"  uuid NOT NULL,
        "couponsId"  uuid NOT NULL,
        CONSTRAINT "PK_courses_coupons_coupons" PRIMARY KEY ("coursesId", "couponsId")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cco_coursesId" ON "courses_coupons_coupons" ("coursesId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cco_couponsId" ON "courses_coupons_coupons" ("couponsId")`);
    await queryRunner.query(`
      ALTER TABLE "courses_coupons_coupons"
        ADD CONSTRAINT "FK_cco_course"  FOREIGN KEY ("coursesId") REFERENCES "courses"("id")  ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT "FK_cco_coupon"  FOREIGN KEY ("couponsId") REFERENCES "coupons"("id")  ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "carts_courses_courses" (
        "cartsId"   uuid NOT NULL,
        "coursesId" uuid NOT NULL,
        CONSTRAINT "PK_carts_courses_courses" PRIMARY KEY ("cartsId", "coursesId")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_crc_cartsId"   ON "carts_courses_courses" ("cartsId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_crc_coursesId" ON "carts_courses_courses" ("coursesId")`);
    await queryRunner.query(`
      ALTER TABLE "carts_courses_courses"
        ADD CONSTRAINT "FK_crc_cart"   FOREIGN KEY ("cartsId")   REFERENCES "carts"("id")   ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT "FK_crc_course" FOREIGN KEY ("coursesId") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "carts_categories_categories" (
        "cartsId"      uuid NOT NULL,
        "categoriesId" uuid NOT NULL,
        CONSTRAINT "PK_carts_categories_categories" PRIMARY KEY ("cartsId", "categoriesId")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_crcat_cartsId"      ON "carts_categories_categories" ("cartsId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_crcat_categoriesId" ON "carts_categories_categories" ("categoriesId")`);
    await queryRunner.query(`
      ALTER TABLE "carts_categories_categories"
        ADD CONSTRAINT "FK_crcat_cart"     FOREIGN KEY ("cartsId")      REFERENCES "carts"("id")      ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT "FK_crcat_category" FOREIGN KEY ("categoriesId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "checkouts_courses_courses" (
        "checkoutsId" uuid NOT NULL,
        "coursesId"   uuid NOT NULL,
        CONSTRAINT "PK_checkouts_courses_courses" PRIMARY KEY ("checkoutsId", "coursesId")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_chc_checkoutsId" ON "checkouts_courses_courses" ("checkoutsId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_chc_coursesId"   ON "checkouts_courses_courses" ("coursesId")`);
    await queryRunner.query(`
      ALTER TABLE "checkouts_courses_courses"
        ADD CONSTRAINT "FK_chc_checkout" FOREIGN KEY ("checkoutsId") REFERENCES "checkouts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT "FK_chc_course"   FOREIGN KEY ("coursesId")   REFERENCES "courses"("id")   ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "checkouts_categories_categories" (
        "checkoutsId"  uuid NOT NULL,
        "categoriesId" uuid NOT NULL,
        CONSTRAINT "PK_checkouts_categories_categories" PRIMARY KEY ("checkoutsId", "categoriesId")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_chcat_checkoutsId"  ON "checkouts_categories_categories" ("checkoutsId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_chcat_categoriesId" ON "checkouts_categories_categories" ("categoriesId")`);
    await queryRunner.query(`
      ALTER TABLE "checkouts_categories_categories"
        ADD CONSTRAINT "FK_chcat_checkout"  FOREIGN KEY ("checkoutsId")  REFERENCES "checkouts"("id")  ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT "FK_chcat_category"  FOREIGN KEY ("categoriesId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Explicit join table from ParentSubscription.children @JoinTable config
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "parent_subscription_children" (
        "parent_subscription_id" uuid NOT NULL,
        "child_id"               uuid NOT NULL,
        CONSTRAINT "PK_parent_subscription_children" PRIMARY KEY ("parent_subscription_id", "child_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_psc_parent_subscription_id" ON "parent_subscription_children" ("parent_subscription_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_psc_child_id"               ON "parent_subscription_children" ("child_id")`);
    await queryRunner.query(`
      ALTER TABLE "parent_subscription_children"
        ADD CONSTRAINT "FK_psc_subscription" FOREIGN KEY ("parent_subscription_id") REFERENCES "parent_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT "FK_psc_child"        FOREIGN KEY ("child_id")               REFERENCES "children"("id")            ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Join tables first
    await queryRunner.query(`DROP TABLE IF EXISTS "parent_subscription_children"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "checkouts_categories_categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "checkouts_courses_courses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "carts_categories_categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "carts_courses_courses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "courses_coupons_coupons"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories_courses_courses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "instructors_organizations_organizations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "students_organizations_organizations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "students_subscribed_categories_categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "students_subscribed_courses_courses"`);

    // Leaf tables
    await queryRunner.query(`DROP TABLE IF EXISTS "issues"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "recommendations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "time_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "submitted_answers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "test_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "questions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "test_suites"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "review_requests"`);

    // Break circular FK before dropping versions/courses
    await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "FK_courses_approvedVersion"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "versions"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "parent_subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "student_subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organization_subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "checkouts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "school_students"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "children"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "courses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coupons"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "students"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admins"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organizations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "parents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "instructors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "carts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "parent_demo_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "student_demo_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "school_demos"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_plans"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "images"`);

    // Enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "time_events_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "test_assignments_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tests_mode_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tests_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "issues_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "reviews_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "questions_class_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "questions_difficulty_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "questions_tags_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "questions_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "test_suites_suite_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "test_suites_difficulty_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "versions_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "courses_currency_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "courses_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "courses_domains_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "instructors_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "admins_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "parent_demo_requests_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "student_demo_requests_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "school_demos_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "school_demos_approximate_students_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "school_demos_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "subscription_plans_interval_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "organization_subscriptions_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "student_subscriptions_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "parent_subscriptions_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "school_students_class_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "children_class_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "parents_gender_enum"`);
  }
}
