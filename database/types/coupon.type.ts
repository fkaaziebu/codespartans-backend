import { Field, ID, ObjectType } from '@nestjs/graphql';
import { CourseTypeClass } from './course.type';
import { OrganizationTypeClass } from './organization.type';

@ObjectType('Coupon')
export class CouponTypeClass {
  @Field(() => ID)
  id: string;

  @Field(() => OrganizationTypeClass, { nullable: true })
  organization?: OrganizationTypeClass;

  @Field(() => [CourseTypeClass], { nullable: true })
  courses?: CourseTypeClass[];
}
