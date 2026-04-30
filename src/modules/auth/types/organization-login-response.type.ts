import { Field, ObjectType } from '@nestjs/graphql';
import { Organization as OrganizationTypeClass } from 'src/modules/auth/entities/organization.entity';

@ObjectType()
export class OrganizationLoginResponse extends OrganizationTypeClass {
  @Field()
  token: string;
}
