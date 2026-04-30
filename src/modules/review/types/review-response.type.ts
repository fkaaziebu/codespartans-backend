import { Field, ObjectType } from '@nestjs/graphql';
import { Review as ReviewTypeClass } from 'src/modules/review/entities/review.entity';

@ObjectType('ReviewResponse')
export class ReviewResponse extends ReviewTypeClass {
  @Field()
  total_issues: number;
}
