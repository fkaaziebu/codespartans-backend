import { Field, InputType } from '@nestjs/graphql';
import {
  CurrencyType,
  DomainType,
  LevelType,
} from 'src/database/types/course.type';

@InputType()
export class CourseInfoInput {
  @Field()
  title: string;

  @Field()
  avatar_url: string;

  @Field()
  description: string;

  @Field(() => [DomainType], { nullable: false })
  domains: DomainType[];

  @Field()
  price: number;

  @Field(() => CurrencyType)
  currency: CurrencyType;

  @Field(() => LevelType)
  level: LevelType;
}
