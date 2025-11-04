import { Field, ObjectType } from '@nestjs/graphql';
import { InstructorTypeClass } from 'src/database/types';

@ObjectType('InstructorResponse')
export class InstructorResponse extends InstructorTypeClass {
  @Field()
  total_created_courses: number;

  @Field()
  total_requested_reviews: number;

  @Field()
  total_approved_courses: number;
}
