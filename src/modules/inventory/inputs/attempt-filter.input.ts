import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AttemptFilterInput {
  @Field({ nullable: true })
  from?: Date;

  @Field({ nullable: true })
  to?: Date;
}
