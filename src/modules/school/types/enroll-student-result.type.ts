import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EnrollStudentResult {
  @Field()
  full_name: string;

  @Field()
  username: string;

  @Field()
  pin: string;
}
