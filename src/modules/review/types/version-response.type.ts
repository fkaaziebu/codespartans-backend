import { Field, ObjectType } from '@nestjs/graphql';
import { VersionTypeClass } from 'src/database/types';
import { ReviewResponse } from './review-response.type';

@ObjectType('VersionResponse')
export class VersionResponse extends VersionTypeClass {
  @Field(() => [ReviewResponse])
  reviews: ReviewResponse[];

  @Field()
  total_questions: number;

  @Field()
  total_reviews: number;
}
