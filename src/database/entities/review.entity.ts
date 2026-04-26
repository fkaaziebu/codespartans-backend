import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Issue } from './issue.entity';
import { Version } from './version.entity';

export enum ReviewStatusType {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

registerEnumType(ReviewStatusType, {
  name: 'ReviewStatusType',
  description: 'Review status',
});

@ObjectType('Review')
@Entity('reviews')
export class Review {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column()
  message: string;

  @Field(() => ReviewStatusType)
  @Column({
    type: 'enum',
    enum: ReviewStatusType,
    default: ReviewStatusType.OPEN,
  })
  status: ReviewStatusType;

  @Field(() => Version, { nullable: true })
  @ManyToOne(() => Version, (version) => version.reviews)
  course_version: Version;

  @Field(() => [Issue], { nullable: true })
  @OneToMany(() => Issue, (issue) => issue.review)
  issues: Issue[];

  @Field()
  @CreateDateColumn()
  inserted_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;
}
