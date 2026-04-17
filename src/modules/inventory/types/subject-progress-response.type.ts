import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('SubjectProgressResponse')
export class SubjectProgressResponse {
  @Field()
  subject: string;

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  correct: number;

  @Field(() => Int)
  wrong: number;

  @Field(() => Float)
  score: number;
}
