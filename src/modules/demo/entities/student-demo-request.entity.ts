import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DemoStatus } from './school-demo.entity';

@ObjectType('StudentDemoRequest')
@Entity('student_demo_requests')
export class StudentDemoRequest {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  full_name: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field()
  @Column({ unique: true })
  demo_code: string;

  @Field()
  @Column()
  target_exam: string;

  @Field(() => DemoStatus)
  @Column({ type: 'enum', enum: DemoStatus, default: DemoStatus.PENDING })
  status: DemoStatus;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'timestamptz' })
  activated_at: Date;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'timestamptz' })
  expires_at: Date;

  @Field()
  @Column({ default: 14 })
  trial_duration_days: number;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
