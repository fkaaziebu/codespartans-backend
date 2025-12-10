import { Field, ObjectType } from '@nestjs/graphql';
import { CourseTypeClass } from 'src/database/types';

@ObjectType('StudentCourseResponse')
export class StudentCourseResponse extends CourseTypeClass {
  @Field()
  is_subscribed: boolean;

  @Field()
  is_course_in_cart: boolean;
}
