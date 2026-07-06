import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewLanguageAndArtsTagEnumValues1780900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_COMPREHENSION'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_CONJUGAISON'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_GRAMMAIRE'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_NEGATION_ET_QUESTIONS'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_NOMBRES_ET_TEMPS'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_SALUTATIONS_ET_EXPRESSIONS'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_VOCABULAIRE'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_AL_ARQAM'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_AL_MUFRADAT'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_AL_QAWAID'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_ATH_THAQAFA'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_AT_TAHIYYAT'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_AMAMMERE'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_KASASIN_MU_NHYEHYEE'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_KASA_NE_NKYEA'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_MME_NE_ANWONSEM'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_NSEMFUA'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_COLOUR'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_ELEMENTS_OF_DESIGN'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_GHANAIAN_ART_AND_CULTURE'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_PERFORMING_ARTS'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_PRINCIPLES_OF_DESIGN'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_VISUAL_ARTS_MEDIA'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_EVE_DEKONU'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_GBEDONAME'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_KASASIN'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_NYAGBEWO'`,
    );
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum ADD VALUE IF NOT EXISTS 'TAG_XEXLEDZESIWO'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL cannot remove enum values directly; recreate the type without them
    await queryRunner.query(
      `CREATE TYPE questions_tags_enum_old AS ENUM ('TAG_GENERAL', 'TAG_NUMBER_AND_NUMERATION', 'TAG_ALGEBRA', 'TAG_GEOMETRY', 'TAG_MENSURATION', 'TAG_STATISTICS_AND_PROBABILITY', 'TAG_TRIGONOMETRY', 'TAG_CALCULUS', 'TAG_VECTORS_AND_MATRICES', 'TAG_SETS', 'TAG_READING_COMPREHENSION', 'TAG_SUMMARY_WRITING', 'TAG_ESSAY_WRITING', 'TAG_GRAMMAR_AND_USAGE', 'TAG_VOCABULARY', 'TAG_ORAL_ENGLISH', 'TAG_PHYSICAL_PROCESSES', 'TAG_LIFE_PROCESSES', 'TAG_EARTH_AND_SPACE', 'TAG_DIVERSITY_OF_MATTER', 'TAG_GHANA_HISTORY', 'TAG_GOVERNMENT_AND_CITIZENSHIP', 'TAG_ECONOMIC_DEVELOPMENT', 'TAG_POPULATION_AND_DEVELOPMENT', 'TAG_ENVIRONMENT_AND_SOCIETY', 'TAG_CULTURE_AND_VALUES', 'TAG_MECHANICS', 'TAG_WAVES_AND_OPTICS', 'TAG_ELECTRICITY_AND_MAGNETISM', 'TAG_HEAT_AND_THERMODYNAMICS', 'TAG_ATOMIC_AND_NUCLEAR_PHYSICS', 'TAG_MEASUREMENT', 'TAG_ATOMIC_STRUCTURE', 'TAG_CHEMICAL_BONDING', 'TAG_STOICHIOMETRY', 'TAG_ORGANIC_CHEMISTRY', 'TAG_ACIDS_BASES_AND_SALTS', 'TAG_ELECTROCHEMISTRY', 'TAG_PERIODIC_TABLE', 'TAG_AIR_AND_WATER', 'TAG_CELL_BIOLOGY', 'TAG_GENETICS_AND_EVOLUTION', 'TAG_ECOLOGY', 'TAG_HUMAN_PHYSIOLOGY', 'TAG_PLANT_BIOLOGY', 'TAG_MICROORGANISMS_AND_DISEASE', 'TAG_CLASSIFICATION', 'TAG_DEMAND_AND_SUPPLY', 'TAG_PRODUCTION_AND_COSTS', 'TAG_NATIONAL_INCOME', 'TAG_MONEY_AND_BANKING', 'TAG_INTERNATIONAL_TRADE', 'TAG_PUBLIC_FINANCE', 'TAG_MAP_READING', 'TAG_PHYSICAL_GEOGRAPHY', 'TAG_HUMAN_GEOGRAPHY', 'TAG_REGIONAL_GEOGRAPHY', 'TAG_ECONOMIC_GEOGRAPHY', 'TAG_PRECOLONIAL_AFRICA', 'TAG_COLONIAL_PERIOD', 'TAG_INDEPENDENCE_MOVEMENTS', 'TAG_GHANA_POLITICAL_HISTORY', 'TAG_CONSTITUTION_AND_LAW', 'TAG_DEMOCRATIC_INSTITUTIONS', 'TAG_PROSE', 'TAG_POETRY', 'TAG_DRAMA', 'TAG_COMPUTER_HARDWARE', 'TAG_SOFTWARE_AND_APPLICATIONS', 'TAG_INTERNET_AND_NETWORKING', 'TAG_PROGRAMMING_BASICS', 'TAG_DATA_MANAGEMENT', 'TAG_FRENCH_GRAMMAR', 'TAG_FRENCH_VOCABULARY', 'TAG_FRENCH_COMPREHENSION', 'TAG_CHRISTIANITY', 'TAG_ISLAM', 'TAG_AFRICAN_TRADITIONAL_RELIGION', 'TAG_DESIGN_AND_TECHNOLOGY', 'TAG_TECHNICAL_DRAWING', 'TAG_FOOD_AND_NUTRITION', 'TAG_CLOTHING_AND_TEXTILES', 'TAG_HOME_MANAGEMENT', 'TAG_ENTREPRENEURSHIP_AND_CAREERS')`,
    );
    await queryRunner.query(
      `UPDATE questions SET tags = ARRAY(
        SELECT CASE
          WHEN tag::text IN ('TAG_COMPREHENSION', 'TAG_CONJUGAISON', 'TAG_GRAMMAIRE', 'TAG_NEGATION_ET_QUESTIONS', 'TAG_NOMBRES_ET_TEMPS', 'TAG_SALUTATIONS_ET_EXPRESSIONS', 'TAG_VOCABULAIRE', 'TAG_AL_ARQAM', 'TAG_AL_MUFRADAT', 'TAG_AL_QAWAID', 'TAG_ATH_THAQAFA', 'TAG_AT_TAHIYYAT', 'TAG_AMAMMERE', 'TAG_KASASIN_MU_NHYEHYEE', 'TAG_KASA_NE_NKYEA', 'TAG_MME_NE_ANWONSEM', 'TAG_NSEMFUA', 'TAG_COLOUR', 'TAG_ELEMENTS_OF_DESIGN', 'TAG_GHANAIAN_ART_AND_CULTURE', 'TAG_PERFORMING_ARTS', 'TAG_PRINCIPLES_OF_DESIGN', 'TAG_VISUAL_ARTS_MEDIA', 'TAG_EVE_DEKONU', 'TAG_GBEDONAME', 'TAG_KASASIN', 'TAG_NYAGBEWO', 'TAG_XEXLEDZESIWO')
          THEN 'TAG_GENERAL'::questions_tags_enum
          ELSE tag
        END
        FROM unnest(tags) AS tag
      )
      WHERE tags && ARRAY['TAG_COMPREHENSION', 'TAG_CONJUGAISON', 'TAG_GRAMMAIRE', 'TAG_NEGATION_ET_QUESTIONS', 'TAG_NOMBRES_ET_TEMPS', 'TAG_SALUTATIONS_ET_EXPRESSIONS', 'TAG_VOCABULAIRE', 'TAG_AL_ARQAM', 'TAG_AL_MUFRADAT', 'TAG_AL_QAWAID', 'TAG_ATH_THAQAFA', 'TAG_AT_TAHIYYAT', 'TAG_AMAMMERE', 'TAG_KASASIN_MU_NHYEHYEE', 'TAG_KASA_NE_NKYEA', 'TAG_MME_NE_ANWONSEM', 'TAG_NSEMFUA', 'TAG_COLOUR', 'TAG_ELEMENTS_OF_DESIGN', 'TAG_GHANAIAN_ART_AND_CULTURE', 'TAG_PERFORMING_ARTS', 'TAG_PRINCIPLES_OF_DESIGN', 'TAG_VISUAL_ARTS_MEDIA', 'TAG_EVE_DEKONU', 'TAG_GBEDONAME', 'TAG_KASASIN', 'TAG_NYAGBEWO', 'TAG_XEXLEDZESIWO']::questions_tags_enum[]`,
    );
    await queryRunner.query(
      `ALTER TABLE questions ALTER COLUMN tags TYPE questions_tags_enum_old[] USING tags::text[]::questions_tags_enum_old[]`,
    );
    await queryRunner.query(`DROP TYPE questions_tags_enum`);
    await queryRunner.query(
      `ALTER TYPE questions_tags_enum_old RENAME TO questions_tags_enum`,
    );
  }
}
