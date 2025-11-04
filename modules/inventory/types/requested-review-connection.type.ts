import { ObjectType } from '@nestjs/graphql';
import { ReviewRequestTypeClass } from 'src/database/types';
import { Paginated } from '../../../helpers/types';

@ObjectType('RequestedReviewConnection')
export class RequestedReviewConnection extends Paginated(
  ReviewRequestTypeClass,
) {}
