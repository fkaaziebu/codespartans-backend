import { Field, ID, ObjectType } from '@nestjs/graphql';
import { OrganizationTypeClass } from './organization.type';
import { VersionTypeClass } from './version.type';

@ObjectType('ReviewRequest')
export class ReviewRequestTypeClass {
  @Field(() => ID)
  id: string;

  @Field(() => OrganizationTypeClass, { nullable: true })
  organization?: OrganizationTypeClass;

  @Field(() => VersionTypeClass, { nullable: true })
  course_version?: VersionTypeClass;

  @Field()
  inserted_at: Date;

  @Field()
  updated_at: Date;
}
