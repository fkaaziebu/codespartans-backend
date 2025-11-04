import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Test } from './test.entity';
import { Question } from './question.entity';

@Entity('submitted_answers')
export class SubmittedAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  question_id: string;

  @Column()
  answer_provided: string;

  @Column('text', { array: true, default: [] })
  hints_used: string[];

  @Column({ default: false })
  is_flagged: boolean;

  @Column('text', { array: true })
  time_ranges: string[];

  @OneToOne(() => Question)
  @JoinColumn()
  question: Question;

  @ManyToOne(() => Test, (test) => test.submitted_answers)
  test: Test;
}
