import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { VersionTypeClass } from './version.type';

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  MULTIPLE_SELECT = 'MULTIPLE_SELECT',
  FILL_IN = 'FILL_IN',
}

export enum QuestionTagType {
  TAG_GENERAL = 'TAG_GENERAL',
  TAG_ENGLISH = 'TAG_ENGLISH',
  TAG_MATHEMATICS = 'TAG_MATHEMATICS',
  TAG_INTEGRATED_SCIENCE = 'TAG_INTEGRATED_SCIENCE',
  TAG_SOCIAL_STUDIES = 'TAG_SOCIAL_STUDIES',
  TAG_PHYSICS = 'TAG_PHYSICS',
  TAG_CHEMISTRY = 'TAG_CHEMISTRY',
  TAG_BIOLOGY = 'TAG_BIOLOGY',
  TAG_ECONOMICS = 'TAG_ECONOMICS',
  TAG_GEOGRAPHY = 'TAG_GEOGRAPHY',
  TAG_HISTORY = 'TAG_HISTORY',
  TAG_GOVERNMENT = 'TAG_GOVERNMENT',
  TAG_ELECTIVE_MATHEMATICS = 'TAG_ELECTIVE_MATHEMATICS',
  TAG_LITERATURE = 'TAG_LITERATURE',
  TAG_ACCOUNTING = 'TAG_ACCOUNTING',
  TAG_BUSINESS_MANAGEMENT = 'TAG_BUSINESS_MANAGEMENT',
  TAG_ICT = 'TAG_ICT',
  TAG_FRENCH = 'TAG_FRENCH',
  TAG_RELIGIOUS_STUDIES = 'TAG_RELIGIOUS_STUDIES',
  TAG_PHYSICAL_EDUCATION = 'TAG_PHYSICAL_EDUCATION',
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
