import { Field, ObjectType } from '@nestjs/graphql';
import { Instructor as InstructorTypeClass } from 'src/database/entities/instructor.entity';

@ObjectType('InstructorResponse')
export class InstructorResponse extends InstructorTypeClass {
  @Field()
  total_created_courses: number;

  @Field()
  total_requested_reviews: number;

  @Field()
  total_approved_courses: number;
}
