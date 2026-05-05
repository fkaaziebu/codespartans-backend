import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ActivateDemoResponse {
  @Field()
  access_token: string;

  @Field()
  org_name: string;

  @Field()
  email: string;

  @Field()
  expires_at: string;
}
