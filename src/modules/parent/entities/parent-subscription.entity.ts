import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubscriptionPlan } from '../../demo/entities/subscription-plan.entity';
import {
  SubscriptionStatus,
} from '../../demo/entities/organization-subscription.entity';
import { Parent } from './parent.entity';

@ObjectType('ParentSubscription')
@Entity('parent_subscriptions')
export class ParentSubscription {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Parent)
  @ManyToOne(() => Parent, { onDelete: 'CASCADE' })
  parent: Parent;

  @Field(() => SubscriptionPlan)
  @ManyToOne(() => SubscriptionPlan)
  plan: SubscriptionPlan;

  @Field()
  @Column({ unique: true })
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
