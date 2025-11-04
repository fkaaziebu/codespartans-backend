import { Field, ObjectType } from '@nestjs/graphql';
import { CourseTypeClass } from 'src/database/types';

@ObjectType('CourseResponse')
export class CourseResponse extends CourseTypeClass {
  @Field()
  is_subscribed: boolean;

  @Field()
  total_questions: number;

  @Field()
  estimated_duration: number;
}
