import { ObjectType } from '@nestjs/graphql';
import { Paginated } from 'src/helpers/types';
import { AttemptResponse } from './attempt-response.type';

@ObjectType('AttemptConnection')
export class AttemptConnection extends Paginated(AttemptResponse) {}
