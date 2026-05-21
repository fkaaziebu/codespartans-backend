import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('TestTopicProgressResponse')
export class TestTopicProgressResponse {
  @Field()
  topic: string;

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  correct: number;

  @Field(() => Int)
  wrong: number;

  @Field(() => Float)
  score: number;
}
