import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class CategoryInfoInput {
  @IsString()
  @Field()
  name: string;

  @IsString()
  @Field()
  avatar_url: string;
}
