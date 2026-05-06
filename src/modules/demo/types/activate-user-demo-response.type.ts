import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ActivateUserDemoResponse {
  @Field()
  access_token: string;

  @Field()
  full_name: string;

  @Field()
  email: string;

  @Field()
  expires_at: string;
}
