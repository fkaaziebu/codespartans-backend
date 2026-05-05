import {
  Field,
  Float,
  ID,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PlanInterval {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

registerEnumType(PlanInterval, { name: 'PlanInterval' });

@ObjectType('SubscriptionPlan')
@Entity('subscription_plans')
export class SubscriptionPlan {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  plan_key: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  tagline: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field(() => Float)
  @Column({ type: 'float' })
  price: number;

  @Field()
  @Column({ default: 'GHS' })
  currency: string;

  @Field(() => PlanInterval)
  @Column({ type: 'enum', enum: PlanInterval })
  interval: PlanInterval;

  @Field(() => Int)
  @Column()
  duration_days: number;

  @Field(() => [String])
  @Column({ type: 'json', default: '[]' })
  features: string[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  billing_label: string;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  max_students: number;

  @Field()
  @Column({ default: false })
  is_custom: boolean;

  @Field()
  @Column({ default: true })
  is_active: boolean;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
