import { Field, ObjectType } from '@nestjs/graphql';
import { Student as StudentTypeClass } from 'src/modules/auth/entities/student.entity';

@ObjectType()
export class StudentLoginResponse extends StudentTypeClass {
  @Field()
  token: string;

  @Field({ nullable: true })
  refresh_token?: string;
}
