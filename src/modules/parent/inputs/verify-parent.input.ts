import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class VerifyParentInput {
  @Field()
  email: string;

  @Field()
  code: string;
}
