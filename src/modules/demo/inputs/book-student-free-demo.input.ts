import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class BookStudentFreeDemoInput {
  @Field()
  full_name: string;

  @Field()
  email: string;

  @Field()
  target_exam: string;
}
