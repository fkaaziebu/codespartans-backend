import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../../helpers/types';
import { AdminResponse } from './admin-response.type';

@ObjectType('AdminConnection')
export class AdminConnection extends Paginated(AdminResponse) {}
