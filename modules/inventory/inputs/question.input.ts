import { Field, InputType } from '@nestjs/graphql';
import {
  QuestionDifficultyType,
  QuestionTagType,
  QuestionType,
} from 'src/database/types/question.type';

@InputType()
export class QuestionInput {
  @Field()
  question_number: number;

  @Field()
  description: string;

  @Field(() => [String])
  hints: string[];

  @Field(() => [String])
  solution_steps: string[];

  @Field(() => [String], { nullable: true })
  options?: string[];

  @Field(() => QuestionType)
  type: QuestionType;

  @Field(() => [QuestionTagType])
  tags: QuestionTagType[];

  @Field(() => QuestionDifficultyType)
  difficulty: QuestionDifficultyType;

  @Field()
  estimated_time_in_ms: number;

  @Field()
  correct_answer: string;
}
