import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubscriptionPlan } from '../../demo/entities/subscription-plan.entity';
import {
  SubscriptionStatus,
} from '../../demo/entities/organization-subscription.entity';
import { Parent } from './parent.entity';
import { Child } from './child.entity';

@ObjectType('ParentSubscription')
@Entity('parent_subscriptions')
export class ParentSubscription {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Parent, { nullable: true })
  @ManyToOne(() => Parent, { onDelete: 'SET NULL', nullable: true })
  parent: Parent | null;

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

  @Field(() => [Child], { nullable: true })
  @ManyToMany(() => Child)
  @JoinTable({
    name: 'parent_subscription_children',
    joinColumn: { name: 'parent_subscription_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'child_id', referencedColumnName: 'id' },
  })
  children: Child[];

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
