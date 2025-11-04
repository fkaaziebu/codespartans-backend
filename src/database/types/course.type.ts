import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CategoryTypeClass } from './category.type';
import { CouponTypeClass } from './coupon.type';
import { InstructorTypeClass } from './instructor.type';
import { OrganizationTypeClass } from './organization.type';
import { StudentTypeClass } from './student.type';
import { VersionTypeClass } from './version.type';

export enum DomainType {
  SCIENCE = 'SCIENCE',
  ENGLISH = 'ENGLISH',
  MATHEMATICS = 'MATHEMATICS',
}

export enum LevelType {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum CurrencyType {
  USD = 'USD',
  EUR = 'EUR',
}

registerEnumType(DomainType, {
  name: 'DomainType',
  description: 'Course domains',
});

registerEnumType(LevelType, {
  name: 'LevelType',
  description: 'Course level',
});

registerEnumType(CurrencyType, {
  name: 'CurrencyType',
  description: 'Currency',
});

@ObjectType('Course')
export class CourseTypeClass {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  avatar_url: string;

  @Field()
  description: string;

  @Field(() => [DomainType])
  domains: DomainType[];

  @Field(() => LevelType)
  level: LevelType;

  @Field()
  price: number;

  @Field(() => CurrencyType)
  currency: CurrencyType;

  @Field(() => [VersionTypeClass], { nullable: true })
  versions?: VersionTypeClass[];

  @Field(() => VersionTypeClass, { nullable: true })
  approved_version?: VersionTypeClass;

  @Field(() => [CouponTypeClass], { nullable: true })
  coupons?: CouponTypeClass[];

  @Field(() => [CategoryTypeClass], { nullable: true })
  categories?: CategoryTypeClass[];

  @Field(() => [StudentTypeClass], { nullable: true })
  subscribed_students?: StudentTypeClass[];

  @Field(() => OrganizationTypeClass, { nullable: true })
  organization?: OrganizationTypeClass;

  @Field(() => InstructorTypeClass, { nullable: true })
  instructor?: InstructorTypeClass;
}
