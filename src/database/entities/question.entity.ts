import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Version } from './version.entity';
import { TestSuite } from './test_suite.entity';

enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  MULTIPLE_SELECT = 'MULTIPLE_SELECT',
  FILL_IN = 'FILL_IN',
}

enum QuestionTagType {
  TAG_GENERAL = 'TAG_GENERAL',
  TAG_ENGLISH = 'TAG_ENGLISH',
  TAG_MATHEMATICS = 'TAG_MATHEMATICS',
  TAG_INTEGRATED_SCIENCE = 'TAG_INTEGRATED_SCIENCE',
  TAG_SOCIAL_STUDIES = 'TAG_SOCIAL_STUDIES',
  TAG_PHYSICS = 'TAG_PHYSICS',
  TAG_CHEMISTRY = 'TAG_CHEMISTRY',
  TAG_BIOLOGY = 'TAG_BIOLOGY',
  TAG_ECONOMICS = 'TAG_ECONOMICS',
  TAG_GEOGRAPHY = 'TAG_GEOGRAPHY',
  TAG_HISTORY = 'TAG_HISTORY',
  TAG_GOVERNMENT = 'TAG_GOVERNMENT',
  TAG_ELECTIVE_MATHEMATICS = 'TAG_ELECTIVE_MATHEMATICS',
  TAG_LITERATURE = 'TAG_LITERATURE',
  TAG_ACCOUNTING = 'TAG_ACCOUNTING',
  TAG_BUSINESS_MANAGEMENT = 'TAG_BUSINESS_MANAGEMENT',
  TAG_ICT = 'TAG_ICT',
  TAG_FRENCH = 'TAG_FRENCH',
  TAG_RELIGIOUS_STUDIES = 'TAG_RELIGIOUS_STUDIES',
  TAG_PHYSICAL_EDUCATION = 'TAG_PHYSICAL_EDUCATION',
}

enum QuestionDifficultyType {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  question_number: number;

  @Column()
  description: string;

  @Column('text', { array: true })
  hints: string[];

  @Column('text', { array: true })
  solution_steps: string[];

  @Column('text', { array: true, nullable: true })
  options?: string[];

  @Column({
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.MULTIPLE_CHOICE,
  })
  type: QuestionType;

  @Column({
    type: 'enum',
    enum: QuestionTagType,
    array: true,
    default: [QuestionTagType.TAG_GENERAL],
  })
  tags: QuestionTagType[];

  @Column()
  correct_answer: string;

  @Column({
    type: 'enum',
    enum: QuestionDifficultyType,
    default: QuestionDifficultyType.EASY,
  })
  difficulty: QuestionDifficultyType;

  @Column()
  estimated_time_in_ms: number;

  @ManyToOne(() => Version, (version) => version.questions)
  version: Version;

  @ManyToOne(() => TestSuite, (test_suite) => test_suite.questions)
  test_suite: TestSuite;
}
