import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('StreakCalendarResponse')
export class StreakCalendarResponse {
  @Field(() => Int)
  current_streak: number;

  @Field(() => Int)
  best_streak: number;

  @Field(() => [String])
  active_dates: string[];
}
