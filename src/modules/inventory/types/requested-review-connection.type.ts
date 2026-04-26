import { ObjectType } from '@nestjs/graphql';
import { ReviewRequest as ReviewRequestTypeClass } from 'src/database/entities/review_request.entity';
import { Paginated } from '../../../helpers/types';

@ObjectType('RequestedReviewConnection')
export class RequestedReviewConnection extends Paginated(
  ReviewRequestTypeClass,
) {}
