import { Field, ObjectType } from '@nestjs/graphql';
import { InstructorTypeClass } from 'src/database/types';

@ObjectType()
export class InstructorLoginResponse extends InstructorTypeClass {
  @Field()
  token: string;
}
