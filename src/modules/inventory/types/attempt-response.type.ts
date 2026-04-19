import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { TestTypeClass } from 'src/database/types';

@ObjectType('AttemptResponse')
export class AttemptResponse extends TestTypeClass {
  @Field()
  course_title: string;

  @Field()
  course_id: string;

  @Field(() => Float)
  score: number;

  @Field()
  date_taken: Date;

  @Field(() => Int)
  correct: number;

  @Field(() => Int)
  wrong: number;

  @Field(() => Float)
  time_taken: number;

  @Field(() => Float, { nullable: true })
  trend?: number;
}
