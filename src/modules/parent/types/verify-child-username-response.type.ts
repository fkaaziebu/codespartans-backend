import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class VerifyChildUsernameResponse {
  @Field()
  temp_token: string;
}
