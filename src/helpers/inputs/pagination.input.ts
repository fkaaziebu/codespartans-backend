import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

@InputType()
export class PaginationInput {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Field(() => Int, { nullable: true })
  first?: number;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  after?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Field(() => Int, { nullable: true })
  last?: number;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  before?: string;
}
