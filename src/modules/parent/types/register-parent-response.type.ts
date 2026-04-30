import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RegisterParentResponse {
  @Field()
  message: string;
}
