import { Field, InputType } from '@nestjs/graphql';
import { SuiteType } from 'src/modules/review/entities/test_suite.entity';
import { QuestionInput } from './question.input';

@InputType()
export class SuiteInput {
  @Field()
  suiteName: string;

  @Field(() => SuiteType)
  suiteType: SuiteType;

  @Field()
  suiteDescription: string;

  @Field(() => [String!]!)
  suiteKeywords: string[];

  @Field(() => [QuestionInput!]!)
  questions: QuestionInput[];
}
