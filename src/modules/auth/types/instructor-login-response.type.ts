import { Field, ObjectType } from '@nestjs/graphql';
import { Instructor as InstructorTypeClass } from 'src/database/entities/instructor.entity';

@ObjectType()
export class InstructorLoginResponse extends InstructorTypeClass {
  @Field()
  token: string;
}
