import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class LoginChildInput {
  @Field()
  temp_token: string;

  @Field()
  pin: string;
}
