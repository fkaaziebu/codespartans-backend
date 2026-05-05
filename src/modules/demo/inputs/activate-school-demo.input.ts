import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ActivateSchoolDemoInput {
  @Field()
  demo_code: string;

  @Field()
  password: string;
}
