import { Field, ID, ObjectType } from '@nestjs/graphql';
import { CourseTypeClass } from './course.type';
import { OrganizationTypeClass } from './organization.type';
import { StudentTypeClass } from './student.type';

@ObjectType('Category')
export class CategoryTypeClass {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  avatar_url: string;

  @Field(() => OrganizationTypeClass, { nullable: true })
  organization?: OrganizationTypeClass;

  @Field(() => [StudentTypeClass], { nullable: true })
  students?: StudentTypeClass[];

  @Field(() => [CourseTypeClass], { nullable: true })
  courses?: CourseTypeClass[];
}
