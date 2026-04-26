import { Field, ObjectType } from '@nestjs/graphql';
import { Course as CourseTypeClass } from 'src/database/entities/course.entity';

@ObjectType('CourseResponse')
export class CourseResponse extends CourseTypeClass {
  @Field()
  is_subscribed: boolean;

  @Field()
  total_questions: number;

  @Field()
  estimated_duration: number;
}
