import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class RequestedReviewFilterInput {
  @Field(() => String, { nullable: true })
  instructorId?: string;

  @Field(() => String, { nullable: true })
  adminId?: string;
}
