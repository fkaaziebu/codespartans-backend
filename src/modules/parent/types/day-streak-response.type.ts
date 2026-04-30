import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('DayStreakResponse')
export class DayStreakResponse {
  @Field()
  date: string;

  @Field()
  is_active: boolean;

  @Field(() => Int)
  count: number;
}
