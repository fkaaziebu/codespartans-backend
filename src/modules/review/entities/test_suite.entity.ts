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

  @Field(() => [Question], { nullable: true })
  @OneToMany(() => Question, (question) => question.test_suite)
  questions: Question[];

  @ManyToOne(() => Version, (course) => course.test_suites)
  course_version: Version;
}
