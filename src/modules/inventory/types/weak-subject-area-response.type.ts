import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Question } from 'src/database/entities/question.entity';

@ObjectType('WeakSubjectAreaResponse')
export class WeakSubjectAreaResponse {
  @Field()
  subject: string;

  @Field(() => Int)
  error_count: number;

  @Field(() => Int)
  total: number;

  @Field(() => Float)
  accuracy: number;

  @Field(() => [Question])
  questions: Question[];
}
