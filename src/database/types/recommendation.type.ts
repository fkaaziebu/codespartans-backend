import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('Recommendation')
export class RecommendationTypeClass {
  @Field(() => ID)
  id: string;

  @Field()
  description: string;
}
