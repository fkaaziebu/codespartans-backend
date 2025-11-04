import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { QuestionTypeClass } from './question.type';

enum SuiteDifficultyType {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

registerEnumType(SuiteDifficultyType, {
  name: 'SuiteDifficultyType',
  description: 'Suite difficulty',
});

@ObjectType('TestSuite')
export class TestSuiteTypeClass {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => [String])
  keywords: string[];

  @Field(() => SuiteDifficultyType)
  difficulty: SuiteDifficultyType;

  @Field(() => [QuestionTypeClass])
  questions: QuestionTypeClass[];
}
