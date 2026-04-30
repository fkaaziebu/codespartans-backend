import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('StreakResponse')
export class StreakResponse {
  @Field(() => Int)
  current_streak: number;

  @Field(() => Int)
  best_streak: number;
}
