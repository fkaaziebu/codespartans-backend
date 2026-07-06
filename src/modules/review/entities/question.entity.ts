import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Version } from './version.entity';
import { TestSuite } from './test_suite.entity';

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  MULTIPLE_SELECT = 'MULTIPLE_SELECT',
  FILL_IN = 'FILL_IN',
  SHORT_ANSWER = 'SHORT_ANSWER',
}

export enum QuestionTagType {
  TAG_GENERAL = 'TAG_GENERAL',

  // Mathematics topics
  TAG_NUMBER_AND_NUMERATION = 'TAG_NUMBER_AND_NUMERATION',
  TAG_ALGEBRA = 'TAG_ALGEBRA',
  TAG_GEOMETRY = 'TAG_GEOMETRY',
  TAG_MENSURATION = 'TAG_MENSURATION',
  TAG_STATISTICS_AND_PROBABILITY = 'TAG_STATISTICS_AND_PROBABILITY',
  TAG_TRIGONOMETRY = 'TAG_TRIGONOMETRY',
  TAG_CALCULUS = 'TAG_CALCULUS',
  TAG_VECTORS_AND_MATRICES = 'TAG_VECTORS_AND_MATRICES',
  TAG_SETS = 'TAG_SETS',

  // English Language topics
  TAG_READING_COMPREHENSION = 'TAG_READING_COMPREHENSION',
  TAG_SUMMARY_WRITING = 'TAG_SUMMARY_WRITING',
  TAG_ESSAY_WRITING = 'TAG_ESSAY_WRITING',
  TAG_GRAMMAR_AND_USAGE = 'TAG_GRAMMAR_AND_USAGE',
  TAG_VOCABULARY = 'TAG_VOCABULARY',
  TAG_ORAL_ENGLISH = 'TAG_ORAL_ENGLISH',

  // Integrated Science topics
  TAG_PHYSICAL_PROCESSES = 'TAG_PHYSICAL_PROCESSES',
  TAG_LIFE_PROCESSES = 'TAG_LIFE_PROCESSES',
  TAG_EARTH_AND_SPACE = 'TAG_EARTH_AND_SPACE',
  TAG_DIVERSITY_OF_MATTER = 'TAG_DIVERSITY_OF_MATTER',

  // Social Studies topics
  TAG_GHANA_HISTORY = 'TAG_GHANA_HISTORY',
  TAG_GOVERNMENT_AND_CITIZENSHIP = 'TAG_GOVERNMENT_AND_CITIZENSHIP',
  TAG_ECONOMIC_DEVELOPMENT = 'TAG_ECONOMIC_DEVELOPMENT',
  TAG_POPULATION_AND_DEVELOPMENT = 'TAG_POPULATION_AND_DEVELOPMENT',
  TAG_ENVIRONMENT_AND_SOCIETY = 'TAG_ENVIRONMENT_AND_SOCIETY',
  TAG_CULTURE_AND_VALUES = 'TAG_CULTURE_AND_VALUES',

  // Physics topics
  TAG_MECHANICS = 'TAG_MECHANICS',
  TAG_WAVES_AND_OPTICS = 'TAG_WAVES_AND_OPTICS',
  TAG_ELECTRICITY_AND_MAGNETISM = 'TAG_ELECTRICITY_AND_MAGNETISM',
  TAG_HEAT_AND_THERMODYNAMICS = 'TAG_HEAT_AND_THERMODYNAMICS',
  TAG_ATOMIC_AND_NUCLEAR_PHYSICS = 'TAG_ATOMIC_AND_NUCLEAR_PHYSICS',
  TAG_MEASUREMENT = 'TAG_MEASUREMENT',

  // Chemistry topics
  TAG_ATOMIC_STRUCTURE = 'TAG_ATOMIC_STRUCTURE',
  TAG_CHEMICAL_BONDING = 'TAG_CHEMICAL_BONDING',
  TAG_STOICHIOMETRY = 'TAG_STOICHIOMETRY',
  TAG_ORGANIC_CHEMISTRY = 'TAG_ORGANIC_CHEMISTRY',
  TAG_ACIDS_BASES_AND_SALTS = 'TAG_ACIDS_BASES_AND_SALTS',
  TAG_ELECTROCHEMISTRY = 'TAG_ELECTROCHEMISTRY',
  TAG_PERIODIC_TABLE = 'TAG_PERIODIC_TABLE',
  TAG_AIR_AND_WATER = 'TAG_AIR_AND_WATER',

  // Biology topics
  TAG_CELL_BIOLOGY = 'TAG_CELL_BIOLOGY',
  TAG_GENETICS_AND_EVOLUTION = 'TAG_GENETICS_AND_EVOLUTION',
  TAG_ECOLOGY = 'TAG_ECOLOGY',
  TAG_HUMAN_PHYSIOLOGY = 'TAG_HUMAN_PHYSIOLOGY',
  TAG_PLANT_BIOLOGY = 'TAG_PLANT_BIOLOGY',
  TAG_MICROORGANISMS_AND_DISEASE = 'TAG_MICROORGANISMS_AND_DISEASE',
  TAG_CLASSIFICATION = 'TAG_CLASSIFICATION',

  // Economics topics
  TAG_DEMAND_AND_SUPPLY = 'TAG_DEMAND_AND_SUPPLY',
  TAG_PRODUCTION_AND_COSTS = 'TAG_PRODUCTION_AND_COSTS',
  TAG_NATIONAL_INCOME = 'TAG_NATIONAL_INCOME',
  TAG_MONEY_AND_BANKING = 'TAG_MONEY_AND_BANKING',
  TAG_INTERNATIONAL_TRADE = 'TAG_INTERNATIONAL_TRADE',
  TAG_PUBLIC_FINANCE = 'TAG_PUBLIC_FINANCE',

  // Geography topics
  TAG_MAP_READING = 'TAG_MAP_READING',
  TAG_PHYSICAL_GEOGRAPHY = 'TAG_PHYSICAL_GEOGRAPHY',
  TAG_HUMAN_GEOGRAPHY = 'TAG_HUMAN_GEOGRAPHY',
  TAG_REGIONAL_GEOGRAPHY = 'TAG_REGIONAL_GEOGRAPHY',
  TAG_ECONOMIC_GEOGRAPHY = 'TAG_ECONOMIC_GEOGRAPHY',

  // History & Government topics
  TAG_PRECOLONIAL_AFRICA = 'TAG_PRECOLONIAL_AFRICA',
  TAG_COLONIAL_PERIOD = 'TAG_COLONIAL_PERIOD',
  TAG_INDEPENDENCE_MOVEMENTS = 'TAG_INDEPENDENCE_MOVEMENTS',
  TAG_GHANA_POLITICAL_HISTORY = 'TAG_GHANA_POLITICAL_HISTORY',
  TAG_CONSTITUTION_AND_LAW = 'TAG_CONSTITUTION_AND_LAW',
  TAG_DEMOCRATIC_INSTITUTIONS = 'TAG_DEMOCRATIC_INSTITUTIONS',

  // Literature topics
  TAG_PROSE = 'TAG_PROSE',
  TAG_POETRY = 'TAG_POETRY',
  TAG_DRAMA = 'TAG_DRAMA',

  // ICT topics
  TAG_COMPUTER_HARDWARE = 'TAG_COMPUTER_HARDWARE',
  TAG_SOFTWARE_AND_APPLICATIONS = 'TAG_SOFTWARE_AND_APPLICATIONS',
  TAG_INTERNET_AND_NETWORKING = 'TAG_INTERNET_AND_NETWORKING',
  TAG_PROGRAMMING_BASICS = 'TAG_PROGRAMMING_BASICS',
  TAG_DATA_MANAGEMENT = 'TAG_DATA_MANAGEMENT',

  // French topics
  TAG_FRENCH_GRAMMAR = 'TAG_FRENCH_GRAMMAR',
  TAG_FRENCH_VOCABULARY = 'TAG_FRENCH_VOCABULARY',
  TAG_FRENCH_COMPREHENSION = 'TAG_FRENCH_COMPREHENSION',
  TAG_COMPREHENSION = 'TAG_COMPREHENSION',
  TAG_CONJUGAISON = 'TAG_CONJUGAISON',
  TAG_GRAMMAIRE = 'TAG_GRAMMAIRE',
  TAG_NEGATION_ET_QUESTIONS = 'TAG_NEGATION_ET_QUESTIONS',
  TAG_NOMBRES_ET_TEMPS = 'TAG_NOMBRES_ET_TEMPS',
  TAG_SALUTATIONS_ET_EXPRESSIONS = 'TAG_SALUTATIONS_ET_EXPRESSIONS',
  TAG_VOCABULAIRE = 'TAG_VOCABULAIRE',

  // Religious & Moral Education topics
  TAG_CHRISTIANITY = 'TAG_CHRISTIANITY',
  TAG_ISLAM = 'TAG_ISLAM',
  TAG_AFRICAN_TRADITIONAL_RELIGION = 'TAG_AFRICAN_TRADITIONAL_RELIGION',

  // Career Technology topics
  TAG_DESIGN_AND_TECHNOLOGY = 'TAG_DESIGN_AND_TECHNOLOGY',
  TAG_TECHNICAL_DRAWING = 'TAG_TECHNICAL_DRAWING',
  TAG_FOOD_AND_NUTRITION = 'TAG_FOOD_AND_NUTRITION',
  TAG_CLOTHING_AND_TEXTILES = 'TAG_CLOTHING_AND_TEXTILES',
  TAG_HOME_MANAGEMENT = 'TAG_HOME_MANAGEMENT',
  TAG_ENTREPRENEURSHIP_AND_CAREERS = 'TAG_ENTREPRENEURSHIP_AND_CAREERS',

  // Arabic topics
  TAG_AL_ARQAM = 'TAG_AL_ARQAM',
  TAG_AL_MUFRADAT = 'TAG_AL_MUFRADAT',
  TAG_AL_QAWAID = 'TAG_AL_QAWAID',
  TAG_ATH_THAQAFA = 'TAG_ATH_THAQAFA',
  TAG_AT_TAHIYYAT = 'TAG_AT_TAHIYYAT',

  // Asante Twi topics
  TAG_AMAMMERE = 'TAG_AMAMMERE',
  TAG_KASASIN_MU_NHYEHYEE = 'TAG_KASASIN_MU_NHYEHYEE',
  TAG_KASA_NE_NKYEA = 'TAG_KASA_NE_NKYEA',
  TAG_MME_NE_ANWONSEM = 'TAG_MME_NE_ANWONSEM',
  TAG_NSEMFUA = 'TAG_NSEMFUA',

  // Creative Arts topics
  TAG_COLOUR = 'TAG_COLOUR',
  TAG_ELEMENTS_OF_DESIGN = 'TAG_ELEMENTS_OF_DESIGN',
  TAG_GHANAIAN_ART_AND_CULTURE = 'TAG_GHANAIAN_ART_AND_CULTURE',
  TAG_PERFORMING_ARTS = 'TAG_PERFORMING_ARTS',
  TAG_PRINCIPLES_OF_DESIGN = 'TAG_PRINCIPLES_OF_DESIGN',
  TAG_VISUAL_ARTS_MEDIA = 'TAG_VISUAL_ARTS_MEDIA',

  // Ewe topics
  TAG_EVE_DEKONU = 'TAG_EVE_DEKONU',
  TAG_GBEDONAME = 'TAG_GBEDONAME',
  TAG_KASASIN = 'TAG_KASASIN',
  TAG_NYAGBEWO = 'TAG_NYAGBEWO',
  TAG_XEXLEDZESIWO = 'TAG_XEXLEDZESIWO',
}

export enum QuestionDifficultyType {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum QuestionClassLevel {
  JHS_1 = 'jhs_1',
  JHS_2 = 'jhs_2',
  JHS_3 = 'jhs_3',
  SHS_1 = 'shs_1',
  SHS_2 = 'shs_2',
  SHS_3 = 'shs_3',
}

registerEnumType(QuestionType, {
  name: 'QuestionType',
  description: 'Question types',
});

registerEnumType(QuestionTagType, {
  name: 'QuestionTagType',
  description: 'Question tag types',
});

registerEnumType(QuestionDifficultyType, {
  name: 'QuestionDifficultyType',
  description: 'Question difficulty types',
});

registerEnumType(QuestionClassLevel, {
  name: 'QuestionClassLevel',
  description: 'Syllabus class level the question originates from',
});

@ObjectType('Question')
@Entity('questions')
export class Question {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Int)
  @Column()
  question_number: number;

  @Field()
  @Column()
  description: string;

  @Field(() => [String])
  @Column('text', { array: true })
  hints: string[];

  @Field(() => [String])
  @Column('text', { array: true })
  solution_steps: string[];

  @Field(() => [String], { nullable: true })
  @Column('text', { array: true, nullable: true })
  options?: string[];

  @Field(() => QuestionType)
  @Column({
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.MULTIPLE_CHOICE,
  })
  type: QuestionType;

  @Field(() => [QuestionTagType])
  @Column({
    type: 'enum',
    enum: QuestionTagType,
    array: true,
    default: [QuestionTagType.TAG_GENERAL],
  })
  tags: QuestionTagType[];

  @Field()
  @Column()
  correct_answer: string;

  @Field(() => QuestionDifficultyType)
  @Column({
    type: 'enum',
    enum: QuestionDifficultyType,
    default: QuestionDifficultyType.EASY,
  })
  difficulty: QuestionDifficultyType;

  @Field(() => Int)
  @Column()
  estimated_time_in_ms: number;

  @Field(() => QuestionClassLevel, { nullable: true })
  @Column({ type: 'enum', enum: QuestionClassLevel, nullable: true })
  class_level?: QuestionClassLevel;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  exam_year?: number;

  @Field(() => Int)
  @Column({ default: 1 })
  marks: number;

  @Field(() => Version, { nullable: true })
  @ManyToOne(() => Version, (version) => version.questions)
  version: Version;

  @ManyToOne(() => TestSuite, (test_suite) => test_suite.questions)
  test_suite: TestSuite;
}
