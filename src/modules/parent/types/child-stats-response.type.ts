import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('ChildStatsResponse')
export class ChildStatsResponse {
  @Field(() => Float)
  avg_score: number;

  @Field(() => Float)
  avg_score_percent_diff: number;

  @Field(() => Int)
  current_streak_count: number;

  @Field(() => Int)
  best_streak_count: number;

  @Field(() => Int)
  total_questions_done: number;

  @Field(() => Float)
  total_questions_percent_diff: number;

  @Field(() => Int)
  sessions_this_week: number;
}
