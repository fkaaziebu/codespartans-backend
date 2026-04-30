import { Field, InputType } from '@nestjs/graphql';
import { VersionStatusType } from 'src/modules/review/entities/version.entity';

@InputType()
export class RequestedReviewFilterInput {
  @Field(() => String, { nullable: true })
  instructorId?: string;

  @Field(() => String, { nullable: true })
  adminId?: string;

  @Field(() => VersionStatusType, { nullable: true })
  status?: VersionStatusType;
}
