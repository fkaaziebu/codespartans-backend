import { Field, Float, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CategoryGradingSystemType } from '../entities/category.entity';

export enum StudentAggregateStateType {
  ZERO_DATA = 'ZERO_DATA',
  PARTIAL_DATA = 'PARTIAL_DATA',
  COMPLETE_DATA = 'COMPLETE_DATA',
}

registerEnumType(StudentAggregateStateType, {
  name: 'StudentAggregateStateType',
  description: 'How much test data is available to predict the aggregate',
});

@ObjectType('CourseAggregateEntry')
export class CourseAggregateEntry {
  @Field(() => ID)
  course_id: string;

  @Field()
  course_title: string;

  @Field()
  is_mandatory: boolean;

  @Field(() => Float, { nullable: true })
  score: number | null;

  @Field({ nullable: true })
  grade: string | null;

  @Field(() => Date, { nullable: true })
  date_taken: Date | null;
}

@ObjectType('StudentAggregateResponse')
export class StudentAggregateResponse {
  @Field(() => StudentAggregateStateType)
  state: StudentAggregateStateType;

  @Field()
  message: string;

  @Field({ nullable: true })
  aggregate_range: string | null;

  @Field(() => ID)
  category_id: string;

  @Field()
  category_name: string;

  @Field(() => CategoryGradingSystemType)
  grading_system: CategoryGradingSystemType;

  @Field(() => [CourseAggregateEntry])
  courses_with_test_taken: CourseAggregateEntry[];

  @Field(() => [CourseAggregateEntry])
  courses_without_test_taken: CourseAggregateEntry[];
}
