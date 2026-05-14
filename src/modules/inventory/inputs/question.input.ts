import { Field, InputType, Int } from '@nestjs/graphql';
import {
  QuestionClassLevel,
  QuestionDifficultyType,
  QuestionTagType,
  QuestionType,
} from 'src/modules/review/entities/question.entity';

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

  @Field(() => QuestionClassLevel, { nullable: true })
  class_level?: QuestionClassLevel;

  @Field(() => Int, { nullable: true })
  exam_year?: number;

  @Field()
  correct_answer: string;

  @Field(() => Int, { nullable: true })
  marks?: number;
}
