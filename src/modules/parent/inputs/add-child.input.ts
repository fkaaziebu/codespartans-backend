import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ClassLevel } from '../entities/child.entity';

@InputType()
export class AddChildInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @Field(() => ClassLevel)
  @IsEnum(ClassLevel)
  class_level: ClassLevel;

  @Field()
  @IsNotEmpty()
  @IsString()
  target_exam: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  school_name?: string;
}
