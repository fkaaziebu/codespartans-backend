import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  PENDING_DELETION = 'PENDING_DELETION',
  DELETED = 'DELETED',
}

registerEnumType(AccountStatus, { name: 'AccountStatus' });

@ObjectType()
export class AccountDeletionResponse {
  @Field()
  message: string;

  @Field(() => Date, { nullable: true })
  deletionScheduledFor: Date | null;

  @Field(() => AccountStatus)
  status: AccountStatus;
}
