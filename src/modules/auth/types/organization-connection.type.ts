import { ObjectType } from '@nestjs/graphql';
import { OrganizationTypeClass } from 'src/database/types';
import { Paginated } from '../../../helpers/types';

@ObjectType('OrganizationConnection')
export class OrganizationConnection extends Paginated(OrganizationTypeClass) {}
