import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { RecommendationTypeClass } from './recommendation.type';
import { SubmittedAnswerTypeClass } from './submitted_answer.type';
import { TestSuiteTypeClass } from './test_suite.type';

export enum TestStatusType {
  ON_GOING = 'ON_GOING',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
}

export enum TestModeType {
  PROCTURED = 'PROCTURED',
  UN_PROCTURED = 'UN_PROCTURED',
}

registerEnumType(TestStatusType, {
  name: 'TestStatusType',
  description: 'Test status',
});

registerEnumType(TestModeType, {
  name: 'TestModeType',
  description: 'Test mode',
});

@ObjectType('Test')
export class TestTypeClass {
  @Field(() => ID)
  id: string;

  @Field(() => TestStatusType)
  status: TestStatusType;

  @Field(() => TestModeType)
  mode: TestModeType;

  @Field(() => [SubmittedAnswerTypeClass], { nullable: true })
  submitted_answers?: SubmittedAnswerTypeClass[];

  @Field(() => TestSuiteTypeClass)
  test_suite: TestSuiteTypeClass;

  @Field(() => [RecommendationTypeClass], { nullable: true })
  recommendations?: RecommendationTypeClass[];
}
