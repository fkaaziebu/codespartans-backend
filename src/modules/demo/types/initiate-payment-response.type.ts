import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class InitiatePaymentResponse {
  @Field()
  authorization_url: string;

  @Field()
  reference: string;
}
