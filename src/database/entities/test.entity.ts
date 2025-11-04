import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TestSuite } from './test_suite.entity';
import { SubmittedAnswer } from './sumitted_answer.entity';
import { TimeEvent } from './time_event.entity';
import { Recommendation } from './recommendation.entity';
import { Student } from './student.entity';

enum TestStatusType {
  ON_GOING = 'ON_GOING',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
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

  @OneToOne(() => TestSuite)
  @JoinColumn()
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
