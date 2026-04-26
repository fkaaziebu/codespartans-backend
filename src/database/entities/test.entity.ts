import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Recommendation } from './recommendation.entity';
import { Student } from './student.entity';
import { SubmittedAnswer } from './sumitted_answer.entity';
import { TestSuite } from './test_suite.entity';
import { TimeEvent } from './time_event.entity';

export enum TestStatusType {
  ON_GOING = 'ON_GOING',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
}

export enum TestModeType {
  PROCTURED = 'PROCTURED',
  UN_PROCTURED = 'UN_PROCTURED',
}

registerEnumType(TestStatusType, {
  name: 'TestStatusType',
  description: 'Test status',
});

registerEnumType(TestModeType, {
  name: 'TestModeType',
  description: 'Test mode',
});

@ObjectType('Test')
@Entity('tests')
export class Test {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => TestStatusType)
  @Column({
    type: 'enum',
    enum: TestStatusType,
    default: TestStatusType.ON_GOING,
  })
  status: TestStatusType;

  @Field(() => TestModeType)
  @Column({
    type: 'enum',
    enum: TestModeType,
    default: TestModeType.PROCTURED,
  })
  mode: TestModeType;

  @Field(() => TestSuite, { nullable: true })
  @ManyToOne(() => TestSuite)
  test_suite: TestSuite;

  @Field(() => [SubmittedAnswer], { nullable: true })
  @OneToMany(() => SubmittedAnswer, (submittedAnswer) => submittedAnswer.test)
  submitted_answers: SubmittedAnswer[];

  @Field(() => [TimeEvent], { nullable: true })
  @OneToMany(() => TimeEvent, (time_event) => time_event.test)
  time_events: TimeEvent[];

  @Field(() => [Recommendation], { nullable: true })
  @OneToMany(() => Recommendation, (recommendation) => recommendation.test)
  recommendations: Recommendation[];

  @Field(() => String, { nullable: true })
  course_id?: string;

  @ManyToOne(() => Student, (student) => student.tests)
  student: Student;
}
