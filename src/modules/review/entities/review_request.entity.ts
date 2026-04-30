import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../../auth/entities/organization.entity';
import { Version } from './version.entity';

@ObjectType('ReviewRequest')
@Entity('review_requests')
export class ReviewRequest {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Organization, { nullable: true })
  @ManyToOne(() => Organization, (version) => version.requested_reviews)
  organization: Organization;

  @Field(() => Version, { nullable: true })
  @OneToOne(() => Version, (version) => version.review_request)
  @JoinColumn()
  course_version: Version;

  @Field()
  @CreateDateColumn()
  inserted_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;
}
