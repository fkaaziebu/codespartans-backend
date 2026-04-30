import { Field, InputType } from '@nestjs/graphql';
import { AddChildInput } from './add-child.input';

@InputType()
export class SetupParentAccountInput {
  @Field(() => [AddChildInput])
  children: AddChildInput[];
}
