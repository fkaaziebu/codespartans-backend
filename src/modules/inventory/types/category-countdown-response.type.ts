import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('CategoryCountdownResponse')
export class CategoryCountdownResponse {
  @Field()
  categoryName: string;

  @Field(() => Int, { nullable: true })
  countdown: number | null;

  @Field(() => Int, { nullable: true })
  exam_duration_days: number | null;
}
