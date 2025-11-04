import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CategoryInfoInput {
  @Field()
  name: string;

  @Field()
  avatar_url: string;
}
