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
  TAG_ALGORITHM = 'TAG_ALGORITHM',
  TAG_DATA_STRUCTURE = 'TAG_DATA_STRUCTURE',
  TAG_DATABASE = 'TAG_DATABASE',
  TAG_NETWORK = 'TAG_NETWORK',
  TAG_SECURITY = 'TAG_SECURITY',
  TAG_SYSTEM = 'TAG_SYSTEM',
  TAG_WEB = 'TAG_WEB',
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
