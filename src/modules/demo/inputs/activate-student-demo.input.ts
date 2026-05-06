import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ActivateStudentDemoInput {
  @Field()
  demo_code: string;

  @Field()
  password: string;
}
