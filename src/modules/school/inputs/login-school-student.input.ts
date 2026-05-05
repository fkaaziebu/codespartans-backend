import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class LoginSchoolStudentInput {
  @Field()
  temp_token: string;

  @Field()
  pin: string;
}
