import { Field, InputType } from '@nestjs/graphql';
import { ClassLevel } from '../entities/child.entity';

@InputType()
export class AddChildInput {
  @Field()
  full_name: string;

  @Field(() => ClassLevel)
  class_level: ClassLevel;

  @Field()
  target_exam: string;

  @Field()
  school_name: string;
}
