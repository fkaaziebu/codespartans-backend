import { Field, ID, ObjectType } from '@nestjs/graphql';
import { TestTypeClass } from './test.type';
import { QuestionTypeClass } from './question.type';

@ObjectType('SubmittedAnswer')
export class SubmittedAnswerTypeClass {
  @Field(() => ID)
  id: string;

  @Field()
  question_id: string;

  @Field()
  answer_provided: string;

  @Field(() => [String])
  hints_used: string[];

  @Field()
  is_flagged: boolean;

  @Field(() => QuestionTypeClass, { nullable: true })
  question: QuestionTypeClass;

  @Field(() => TestTypeClass, { nullable: true })
  test: TestTypeClass;
}
