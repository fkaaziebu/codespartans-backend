import { Field, InputType } from '@nestjs/graphql';
import { AddSchoolStudentInput } from './add-school-student.input';

@InputType()
export class BulkEnrollStudentsInput {
  @Field(() => [AddSchoolStudentInput])
  students: AddSchoolStudentInput[];
}
