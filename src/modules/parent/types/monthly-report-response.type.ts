import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('MonthlyReportResponse')
export class MonthlyReportResponse {
  @Field(() => Int)
  month: number;

  @Field(() => Int)
  year: number;

  @Field(() => Float)
  avg_score: number;

  @Field(() => Int)
  total_questions: number;

  @Field(() => Int)
  streak_days: number;
}
