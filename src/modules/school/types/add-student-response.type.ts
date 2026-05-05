import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AddStudentResponse {
  @Field()
  message: string;

  @Field()
  pin: string;
}
