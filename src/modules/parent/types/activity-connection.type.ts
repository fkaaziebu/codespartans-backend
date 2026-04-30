import { ObjectType } from '@nestjs/graphql';
import { Paginated } from 'src/helpers/types';
import { ActivityResponse } from './activity-response.type';

@ObjectType('ActivityConnection')
export class ActivityConnection extends Paginated(ActivityResponse) {}
