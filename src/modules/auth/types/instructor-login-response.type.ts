import { Field, ObjectType } from '@nestjs/graphql';
import { Instructor as InstructorTypeClass } from 'src/modules/auth/entities/instructor.entity';

@ObjectType()
export class InstructorLoginResponse extends InstructorTypeClass {
  @Field()
  token: string;
}
