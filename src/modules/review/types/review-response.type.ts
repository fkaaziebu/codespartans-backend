import { Field, ObjectType } from '@nestjs/graphql';
import { ReviewTypeClass } from 'src/database/types';

@ObjectType('ReviewResponse')
export class ReviewResponse extends ReviewTypeClass {
  @Field()
  total_issues: number;
}
