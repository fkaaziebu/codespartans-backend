import { Field, ID, ObjectType } from '@nestjs/graphql';
import { CategoryTypeClass } from './category.type';
import { CourseTypeClass } from './course.type';
import { StudentTypeClass } from './student.type';

@ObjectType('Cart')
export class CartTypeClass {
  @Field(() => ID)
  id: string;

  @Field(() => StudentTypeClass, { nullable: true })
  student?: StudentTypeClass;

  @Field(() => [CourseTypeClass], { nullable: true })
  courses?: CourseTypeClass[];

  @Field(() => [CategoryTypeClass], { nullable: true })
  categories?: CategoryTypeClass[];
}
