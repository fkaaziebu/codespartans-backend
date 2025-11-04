import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ReviewTypeClass } from './review.type';

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
export class IssueTypeClass {
  @Field(() => ID)
  id: string;

  @Field()
  description: string;

  @Field(() => IssueStatusType)
  status: IssueStatusType;

  @Field({ nullable: true })
  response?: string;

  @Field(() => ReviewTypeClass, { nullable: true })
  review?: ReviewTypeClass;
}
