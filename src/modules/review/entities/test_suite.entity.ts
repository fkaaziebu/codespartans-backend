import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Question } from './question.entity';
import { Version } from './version.entity';

export enum SuiteDifficultyType {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

registerEnumType(SuiteDifficultyType, {
  name: 'SuiteDifficultyType',
  description: 'Suite difficulty',
});

export enum SuiteType {
  YEAR = 'YEAR',
  YEAR_ONE = 'YEAR_ONE',
  YEAR_TWO = 'YEAR_TWO',
  YEAR_THREE = 'YEAR_THREE',
  MIXED = 'MIXED',
  PAST_QUESTIONS = 'PAST_QUESTIONS',
  // deprecated: will be removed later
  CLASS = 'CLASS',
  TOPIC = 'TOPIC',
}

registerEnumType(SuiteType, {
  name: 'SuiteType',
  description:
    'Suite type — Year-based exam prep, Class level, or Topic focused',
});

@ObjectType('TestSuite')
@Entity('test_suites')
export class TestSuite {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  title: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field(() => [String], { nullable: true })
  @Column('text', { array: true, nullable: true })
  keywords: string[];

  @Field(() => SuiteDifficultyType)
  @Column({
    type: 'enum',
    enum: SuiteDifficultyType,
    default: SuiteDifficultyType.BEGINNER,
  })
  difficulty: SuiteDifficultyType;

  @Field(() => SuiteType, { nullable: true })
  @Column({
    type: 'enum',
    enum: SuiteType,
    nullable: true,
  })
  suite_type: SuiteType;

  @Field({ nullable: true })
  @Column({ nullable: true })
  image_url: string;

  @Field(() => [Question], { nullable: true })
  @OneToMany(() => Question, (question) => question.test_suite)
  questions: Question[];

  @Column({ nullable: true })
  categoryId: string;

  @ManyToOne(() => Version, (course) => course.test_suites)
  course_version: Version;
}
