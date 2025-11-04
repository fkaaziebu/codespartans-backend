import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class IssueInfoInput {
  @Field()
  description: string;
}
