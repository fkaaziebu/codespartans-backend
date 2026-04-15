import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('StudentStatsResponse')
export class StudentStatsResponse {
  @Field(() => Int)
  total_test_taken: number;

  @Field(() => Float)
  total_test_taken_percentage_change: number;

  @Field(() => Float)
  average_score: number;

  @Field(() => Float)
  average_score_percentage_change: number;

  @Field(() => Float)
  study_hours: number;

  @Field(() => Int)
  weak_areas_count: number;
}
