import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { AdminTypeClass } from './admin.type';
import { CourseTypeClass } from './course.type';
import { QuestionTypeClass } from './question.type';
import { ReviewTypeClass } from './review.type';
import { ReviewRequestTypeClass } from './review_request.type';
import { TestSuiteTypeClass } from './test_suite.type';

export enum VersionStatusType {
  ARCHIVED = 'ARCHIVED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

registerEnumType(VersionStatusType, {
  name: 'VersionStatusType',
  description: 'Version status',
});

@ObjectType('Version')
export class VersionTypeClass {
  @Field(() => ID)
  id: string;

  @Field()
  version_number: number;

  @Field(() => VersionStatusType)
  status: VersionStatusType;

  @Field(() => ReviewRequestTypeClass, { nullable: true })
  review_request?: ReviewRequestTypeClass;

  @Field(() => AdminTypeClass, { nullable: true })
  assigned_admin?: AdminTypeClass;

  @Field(() => CourseTypeClass, { nullable: true })
  course?: CourseTypeClass;

  @Field(() => [ReviewTypeClass], { nullable: true })
  reviews?: ReviewTypeClass[];

  @Field(() => [QuestionTypeClass], { nullable: true })
  questions?: QuestionTypeClass[];

  @Field(() => [TestSuiteTypeClass], { nullable: true })
  test_suites?: TestSuiteTypeClass[];

  @Field()
  inserted_at: Date;

  @Field()
  updated_at: Date;
}
