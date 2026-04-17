import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('WeakSubjectAreaResponse')
export class WeakSubjectAreaResponse {
  @Field()
  subject: string;

  @Field(() => Int)
  error_count: number;

  @Field(() => Int)
  total: number;

  @Field(() => Float)
  accuracy: number;
}
