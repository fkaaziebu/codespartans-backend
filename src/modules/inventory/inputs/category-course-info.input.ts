import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

@InputType()
export class CategoryCourseInfoInput {
  @IsString()
  @Field()
  courseName: string;

  @IsBoolean()
  @Field()
  isMandatory: boolean;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  imageUrl?: string;
}
