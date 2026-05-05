import { Field, ObjectType } from '@nestjs/graphql';
import { SchoolStudent } from '../entities/school-student.entity';

@ObjectType()
export class LoginSchoolStudentResponse extends SchoolStudent {
  @Field()
  token: string;

  @Field()
  refresh_token: string;
}
