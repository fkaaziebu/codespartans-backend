import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { OrganizationTypeClass } from './organization.type';
import { VersionTypeClass } from './version.type';

enum AdminStatusType {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

registerEnumType(AdminStatusType, {
  name: 'AdminStatusType',
  description: 'Admin status',
});

@ObjectType('Admin')
export class AdminTypeClass {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => AdminStatusType)
  status: AdminStatusType;

  @Field(() => OrganizationTypeClass, { nullable: true })
  organization?: OrganizationTypeClass;

  @Field(() => [VersionTypeClass], { nullable: true })
  assigned_course_versions_for_review?: VersionTypeClass[];
}
