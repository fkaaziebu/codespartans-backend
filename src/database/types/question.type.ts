import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { VersionTypeClass } from './version.type';

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  MULTIPLE_SELECT = 'MULTIPLE_SELECT',
  FILL_IN = 'FILL_IN',
}

export enum QuestionTagType {
  TAG_GENERAL = 'TAG_GENERAL',
  TAG_ALGORITHM = 'TAG_ALGORITHM',
  TAG_DATA_STRUCTURE = 'TAG_DATA_STRUCTURE',
  TAG_DATABASE = 'TAG_DATABASE',
  TAG_NETWORK = 'TAG_NETWORK',
  TAG_SECURITY = 'TAG_SECURITY',
  TAG_SYSTEM = 'TAG_SYSTEM',
  TAG_WEB = 'TAG_WEB',
}

export enum QuestionDifficultyType {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

registerEnumType(QuestionType, {
  name: 'QuestionType',
  description: 'Question types',
});

registerEnumType(QuestionTagType, {
  name: 'QuestionTagType',
  description: 'Question tag types',
});

registerEnumType(QuestionDifficultyType, {
  name: 'QuestionDifficultyType',
  description: 'Question difficulty types',
});

@ObjectType('Question')
export class QuestionTypeClass {
  @Field(() => ID)
  id: string;

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

  @Field()
  correct_answer: string;

  @Field(() => QuestionDifficultyType)
  difficulty: QuestionDifficultyType;

  @Field()
  estimated_time_in_ms: number;

  @Field(() => VersionTypeClass, { nullable: true })
  version?: VersionTypeClass;
}
