import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType('TestScoreHistoryResponse')
export class TestScoreHistoryResponse {
  @Field()
  test_id: string;

  @Field()
  course_title: string;

  @Field(() => Float)
  score: number;

  @Field()
  date_taken: Date;
}
