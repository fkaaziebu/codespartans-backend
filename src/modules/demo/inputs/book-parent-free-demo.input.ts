import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class BookParentFreeDemoInput {
  @Field()
  full_name: string;

  @Field()
  email: string;

  @Field(() => [String])
  target_exams: string[];
}
