import { Field, ObjectType } from '@nestjs/graphql';
import { Parent } from '../entities/parent.entity';
import { AccountStatus } from 'src/modules/auth/types/account-deletion-response.type';

@ObjectType()
export class LoginParentResponse extends Parent {
  @Field()
  token: string;

  @Field({ nullable: true })
  refresh_token?: string;

  @Field(() => AccountStatus, { nullable: true })
  account_status?: AccountStatus;

  @Field(() => Date, { nullable: true })
  deletion_scheduled_for?: Date;
}
