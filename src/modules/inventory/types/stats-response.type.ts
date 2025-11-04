import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('StatsResponse')
export class StatsResponse {
  @Field()
  total_instructors: number;

  @Field()
  total_admins: number;

  @Field()
  total_requested_reviews: number;

  @Field()
  total_assigned_reviews: number;

  @Field()
  total_completed_reviews: number;
}
