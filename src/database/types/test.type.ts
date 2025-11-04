import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { SubmittedAnswerTypeClass } from './submitted_answer.type';

export enum TestStatusType {
  ON_GOING = 'ON_GOING',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
}

registerEnumType(TestStatusType, {
  name: 'TestStatusType',
  description: 'Test status',
});

@ObjectType('Test')
export class TestTypeClass {
  @Field(() => ID)
  id: string;

  @Field(() => TestStatusType)
  status: TestStatusType;

  @Field(() => [SubmittedAnswerTypeClass], { nullable: true })
  submitted_answers?: SubmittedAnswerTypeClass[];
}
