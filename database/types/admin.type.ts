import { Field, ID, ObjectType } from '@nestjs/graphql';
import { OrganizationTypeClass } from './organization.type';
import { VersionTypeClass } from './version.type';

@ObjectType('Admin')
export class AdminTypeClass {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => OrganizationTypeClass, { nullable: true })
  organization?: OrganizationTypeClass;

  @Field(() => [VersionTypeClass], { nullable: true })
  assigned_course_versions_for_review?: VersionTypeClass[];
}
