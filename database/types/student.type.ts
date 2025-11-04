import { Field, ID, ObjectType } from '@nestjs/graphql';
import { CartTypeClass } from './cart.type';
import { CategoryTypeClass } from './category.type';
import { CheckoutTypeClass } from './checkout.type';
import { CourseTypeClass } from './course.type';
import { OrganizationTypeClass } from './organization.type';

@ObjectType('Student')
export class StudentTypeClass {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => [CourseTypeClass], { nullable: true })
  subscribed_courses?: CourseTypeClass[];

  @Field(() => [CategoryTypeClass], { nullable: true })
  subscribed_categories?: CategoryTypeClass[];

  @Field(() => [OrganizationTypeClass], { nullable: true })
  organizations?: OrganizationTypeClass[];

  @Field(() => [CheckoutTypeClass], { nullable: true })
  checkouts?: CheckoutTypeClass[];

  @Field(() => CartTypeClass, { nullable: true })
  cart?: CartTypeClass;
}
