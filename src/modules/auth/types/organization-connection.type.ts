import { ObjectType } from '@nestjs/graphql';
import { Organization as OrganizationTypeClass } from 'src/modules/auth/entities/organization.entity';
import { Paginated } from '../../../helpers/types';

@ObjectType('OrganizationConnection')
export class OrganizationConnection extends Paginated(OrganizationTypeClass) {}
