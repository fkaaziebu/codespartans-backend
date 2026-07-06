import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CategoryCourseInfoInput {
  @Field()
  courseName: string;

  @Field()
  isMandatory: boolean;

  @Field({ nullable: true })
  imageUrl?: string;
}
