import { Field, ObjectType } from '@nestjs/graphql';
import { Course as CourseTypeClass } from 'src/database/entities/course.entity';

@ObjectType('StudentCourseResponse')
export class StudentCourseResponse extends CourseTypeClass {
  @Field()
  is_subscribed: boolean;

  @Field()
  is_course_in_cart: boolean;
}
