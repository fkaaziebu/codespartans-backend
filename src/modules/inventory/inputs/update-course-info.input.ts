import { Field, InputType } from '@nestjs/graphql';
import { CurrencyType, DomainType } from 'src/database/types/course.type';

@InputType()
export class UpdateCourseInfoInput {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  avatar_url?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [DomainType], { nullable: true })
  domains?: DomainType[];

  @Field({ nullable: true })
  price?: number;

  @Field(() => CurrencyType, { nullable: true })
  currency?: CurrencyType;
}
