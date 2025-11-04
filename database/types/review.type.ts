import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { IssueTypeClass } from './issue.type';
import { VersionTypeClass } from './version.type';

export enum ReviewStatusType {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

registerEnumType(ReviewStatusType, {
  name: 'ReviewStatusType',
  description: 'Review status',
});

@ObjectType('Review')
export class ReviewTypeClass {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  message: string;

  @Field(() => ReviewStatusType)
  status: ReviewStatusType;

  @Field(() => VersionTypeClass, { nullable: true })
  course_version?: VersionTypeClass;

  @Field(() => [IssueTypeClass], { nullable: true })
  issues?: IssueTypeClass[];

  @Field()
  inserted_at: Date;

  @Field()
  updated_at: Date;
}
