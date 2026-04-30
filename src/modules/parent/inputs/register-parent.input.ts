import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class RegisterParentInput {
  @Field()
  first_name: string;

  @Field()
  last_name: string;

  @Field()
  email: string;

  @Field()
  whatsapp_number: string;

  @Field()
  password: string;
}
