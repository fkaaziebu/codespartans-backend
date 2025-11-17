import { Field, InputType } from '@nestjs/graphql';
import { VersionStatusType } from 'src/database/types/version.type';

@InputType()
export class RequestedReviewFilterInput {
  @Field(() => String, { nullable: true })
  instructorId?: string;

  @Field(() => String, { nullable: true })
  adminId?: string;

  @Field(() => VersionStatusType, { nullable: true })
  status?: VersionStatusType;
}
