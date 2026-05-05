import { Field, InputType } from '@nestjs/graphql';
import { ApproximateStudents, SchoolDemoRole } from '../entities/school-demo.entity';

@InputType()
export class BookSchoolFreeDemoInput {
  @Field()
  name: string;

  @Field()
  school_name: string;

  @Field(() => SchoolDemoRole)
  role: SchoolDemoRole;

  @Field(() => ApproximateStudents)
  approximate_students: ApproximateStudents;

  @Field()
  email: string;

  @Field()
  whatsapp_number: string;
}
