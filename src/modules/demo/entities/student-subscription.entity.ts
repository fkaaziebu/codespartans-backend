import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubscriptionPlan } from './subscription-plan.entity';
import { SubscriptionStatus } from './organization-subscription.entity';
import { Student } from '../../auth/entities/student.entity';

@ObjectType('StudentSubscription')
@Entity('student_subscriptions')
export class StudentSubscription {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Student, { nullable: true })
  @ManyToOne(() => Student, { onDelete: 'SET NULL', nullable: true })
  student: Student | null;

  @Field(() => SubscriptionPlan)
  @ManyToOne(() => SubscriptionPlan)
  plan: SubscriptionPlan;

  @Field({ nullable: true })
  @Column({ unique: true, nullable: true })
  paystack_reference: string;

  @Field(() => SubscriptionStatus)
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Field()
  @Column({ type: 'timestamptz' })
  started_at: Date;

  @Field()
  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
