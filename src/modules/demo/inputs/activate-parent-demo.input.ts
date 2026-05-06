import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ActivateParentDemoInput {
  @Field()
  demo_code: string;

  @Field()
  password: string;
}
