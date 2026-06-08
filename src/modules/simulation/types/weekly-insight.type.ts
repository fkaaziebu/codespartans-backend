import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('WeeklyInsightSuite')
export class WeeklyInsightSuite {
  @Field(() => ID)
  suite_id: string;

  @Field()
  title: string;

  @Field(() => Float)
  accuracy: number;
}

@ObjectType('WeeklyInsight')
export class WeeklyInsight {
  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => [WeeklyInsightSuite])
  suites: WeeklyInsightSuite[];
}
