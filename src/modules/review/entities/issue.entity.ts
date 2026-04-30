import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Review } from './review.entity';

export enum IssueStatusType {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

registerEnumType(IssueStatusType, {
  name: 'IssueStatusType',
  description: 'Issue status',
});

@ObjectType('Issue')
@Entity('issues')
export class Issue {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  description: string;

  @Field(() => IssueStatusType)
  @Column({
    type: 'enum',
    enum: IssueStatusType,
    default: IssueStatusType.OPEN,
  })
  status: IssueStatusType;

  @Field({ nullable: true })
  @Column({ default: null })
  response: string;

  @Field(() => Review, { nullable: true })
  @ManyToOne(() => Review, (review) => review.issues)
  review: Review;
}
