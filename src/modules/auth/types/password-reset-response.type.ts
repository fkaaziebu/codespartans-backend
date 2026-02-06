import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PasswordResetResponse {
  @Field()
  message: string;
}
