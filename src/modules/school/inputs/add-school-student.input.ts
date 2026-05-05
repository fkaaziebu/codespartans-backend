import { Field, InputType } from '@nestjs/graphql';
import { ClassLevel } from '../../parent/entities/child.entity';

@InputType()
export class AddSchoolStudentInput {
  @Field()
  full_name: string;

  @Field(() => ClassLevel)
  class_level: ClassLevel;

  @Field()
  target_exam: string;
}
