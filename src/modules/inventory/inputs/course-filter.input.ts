import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CourseFilterInput {
  @Field(() => Boolean, { nullable: true })
  is_subscribed?: boolean;
}
