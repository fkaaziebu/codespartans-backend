import { Field, InputType } from '@nestjs/graphql';
import { SuiteType } from 'src/modules/review/entities/test_suite.entity';

@InputType()
export class SuiteFilterInput {
  @Field(() => SuiteType, { nullable: true })
  suite_type?: SuiteType;
}
