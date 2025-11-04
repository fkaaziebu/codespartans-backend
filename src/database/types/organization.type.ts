import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AdminTypeClass } from './admin.type';
import { CategoryTypeClass } from './category.type';
import { CouponTypeClass } from './coupon.type';
import { CourseTypeClass } from './course.type';
import { InstructorTypeClass } from './instructor.type';
import { ReviewRequestTypeClass } from './review_request.type';
import { StudentTypeClass } from './student.type';

@ObjectType('Organization')
export class OrganizationTypeClass {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => [AdminTypeClass], { nullable: true })
  admins?: AdminTypeClass[];

  @Field(() => [InstructorTypeClass], { nullable: true })
  instructors?: InstructorTypeClass[];

  @Field(() => [StudentTypeClass], { nullable: true })
  students?: StudentTypeClass[];

  @Field(() => [CourseTypeClass], { nullable: true })
  organizational_courses?: CourseTypeClass[];

  @Field(() => [CategoryTypeClass], { nullable: true })
  organizational_categories?: CategoryTypeClass[];

  @Field(() => [CouponTypeClass], { nullable: true })
  organizational_coupons?: CouponTypeClass[];

  @Field(() => [ReviewRequestTypeClass], { nullable: true })
  requested_reviews?: ReviewRequestTypeClass[];
}
