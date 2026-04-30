import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class VerifyChildUsernameInput {
  @Field()
  username: string;
}
