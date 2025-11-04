import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ReviewInfoInput {
  @Field()
  title: string;

  @Field()
  message: string;
}
