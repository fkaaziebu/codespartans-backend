import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Question } from './question.entity';
import { Test } from './test.entity';

@ObjectType('SubmittedAnswer')
@Entity('submitted_answers')
export class SubmittedAnswer {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column('uuid')
  question_id: string;

  @Field()
  @Column()
  answer_provided: string;

  @Field(() => [String])
  @Column('text', { array: true, default: [] })
  hints_used: string[];

  @Field()
  @Column({ default: false })
  is_flagged: boolean;

  @Column('text', { array: true })
  time_ranges: string[];

  @Field(() => Question, { nullable: true })
  @ManyToOne(() => Question)
  question: Question;

  @Field(() => Test, { nullable: true })
  @ManyToOne(() => Test, (test) => test.submitted_answers)
  test: Test;
}
