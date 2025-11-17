import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CourseTypeClass } from './course.type';
import { OrganizationTypeClass } from './organization.type';

enum InstructorStatusType {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

registerEnumType(InstructorStatusType, {
  name: 'InstructorStatusType',
  description: 'Instructor status',
});

@ObjectType('Instructor')
export class InstructorTypeClass {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => InstructorStatusType)
  status: InstructorStatusType;

  @Field(() => [OrganizationTypeClass], { nullable: true })
  organizations?: OrganizationTypeClass[];

  @Field(() => [CourseTypeClass], { nullable: true })
  created_courses?: CourseTypeClass[];
}
