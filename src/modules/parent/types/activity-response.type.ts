import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('ActivityResponse')
export class ActivityResponse {
  @Field()
  activity_date: Date;

  @Field(() => Float)
  score: number;

  @Field(() => Int)
  questions_done: number;

  @Field({ nullable: true })
  course_title?: string;
}
