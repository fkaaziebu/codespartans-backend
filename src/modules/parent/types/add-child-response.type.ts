import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AddChildResponse {
  @Field()
  message: string;

  @Field()
  pin: string;
}
