import { Field, ObjectType } from '@nestjs/graphql';
import { Student as StudentTypeClass } from 'src/modules/auth/entities/student.entity';
import { AccountStatus } from './account-deletion-response.type';

@ObjectType()
export class StudentLoginResponse extends StudentTypeClass {
  @Field()
  token: string;

  @Field({ nullable: true })
  refresh_token?: string;

  @Field(() => AccountStatus, { nullable: true })
  account_status?: AccountStatus;

  @Field(() => Date, { nullable: true })
  deletion_scheduled_for?: Date;
}
