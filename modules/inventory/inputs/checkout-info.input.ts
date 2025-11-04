import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CheckoutInfoInput {
  @Field(() => [String], { nullable: true })
  course_ids?: string[];

  @Field(() => [String], { nullable: true })
  category_ids?: string[];

  @Field(() => [String], { nullable: true })
  coupon_ids?: string[];
}
