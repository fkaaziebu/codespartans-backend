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

enum TestStatusType {
  ON_GOING = 'ON_GOING',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
}

enum TestModeType {
  PROCTURED = 'PROCTURED',
  UN_PROCTURED = 'UN_PROCTURED',
}

@Entity('tests')
export class Test {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TestStatusType,
    default: TestStatusType.ON_GOING,
  })
  status: TestStatusType;

  @Column({
    type: 'enum',
    enum: TestModeType,
    default: TestModeType.PROCTURED,
  })
  mode: TestModeType;

  @ManyToOne(() => TestSuite)
  test_suite: TestSuite;

  @OneToMany(() => SubmittedAnswer, (submittedAnswer) => submittedAnswer.test)
  submitted_answers: SubmittedAnswer[];

  @OneToMany(() => TimeEvent, (time_event) => time_event.test)
  time_events: TimeEvent[];

  @OneToMany(() => Recommendation, (recommendation) => recommendation.test)
  recommendations: Recommendation[];

  @ManyToOne(() => Student, (student) => student.tests)
  student: Student;
}
