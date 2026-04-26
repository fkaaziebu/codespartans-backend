import { Field, ObjectType } from '@nestjs/graphql';
import { Student as StudentTypeClass } from 'src/database/entities/student.entity';

@ObjectType()
export class StudentLoginResponse extends StudentTypeClass {
  @Field()
  token: string;

  @Field()
  refresh_token: string;
}
