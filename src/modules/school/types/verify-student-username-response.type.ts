import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class VerifyStudentUsernameResponse {
  @Field()
  temp_token: string;
}
