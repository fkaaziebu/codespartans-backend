import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Question } from './question.entity';
import { Version } from './version.entity';

enum SuiteDifficultyType {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

@Entity('test_suites')
export class TestSuite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column('text', { array: true, nullable: true })
  keywords: string[];

  @Column({
    type: 'enum',
    enum: SuiteDifficultyType,
    default: SuiteDifficultyType.BEGINNER,
  })
  difficulty: SuiteDifficultyType;

  @OneToMany(() => Question, (question) => question.test_suite)
  questions: Question[];

  @ManyToOne(() => Version, (course) => course.test_suites)
  course_version: Version;
}
