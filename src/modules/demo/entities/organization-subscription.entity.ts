import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../auth/entities/organization.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

registerEnumType(SubscriptionStatus, { name: 'SubscriptionStatus' });

@ObjectType('OrgSubscription')
@Entity('organization_subscriptions')
export class OrgSubscription {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Organization)
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  organization: Organization;

  @Field(() => SubscriptionPlan)
  @ManyToOne(() => SubscriptionPlan)
  plan: SubscriptionPlan;

  @Field({ nullable: true })
  @Column({ unique: true, nullable: true })
  paystack_reference: string;

  @Field(() => SubscriptionStatus)
  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
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
