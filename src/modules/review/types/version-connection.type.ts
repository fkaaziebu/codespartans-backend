import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../../helpers/types';
import { VersionResponse } from './version-response.type';

@ObjectType('VersionConnection')
export class VersionConnection extends Paginated(VersionResponse) {}
