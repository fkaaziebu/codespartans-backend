import { Field, ID, ObjectType } from '@nestjs/graphql';
import { CourseTypeClass } from './course.type';
import { OrganizationTypeClass } from './organization.type';

@ObjectType('Instructor')
export class InstructorTypeClass {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => [OrganizationTypeClass], { nullable: true })
  organizations?: OrganizationTypeClass[];

  @Field(() => [CourseTypeClass], { nullable: true })
  created_courses?: CourseTypeClass[];
}
