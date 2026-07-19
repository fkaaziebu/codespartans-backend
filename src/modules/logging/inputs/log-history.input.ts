import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { LoggableModuleEnum, LogLevelEnum } from '../types/logging-enums.type';

@InputType()
export class LogHistoryInput {
  @IsOptional()
  @IsEnum(LoggableModuleEnum)
  @Field(() => LoggableModuleEnum, { nullable: true })
  module?: LoggableModuleEnum;

  @IsOptional()
  @IsEnum(LogLevelEnum)
  @Field(() => LogLevelEnum, { nullable: true })
  level?: LogLevelEnum;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  requestId?: string;

  @IsOptional()
  @IsDate()
  @Field(() => Date, { nullable: true })
  from?: Date;

  @IsOptional()
  @IsDate()
  @Field(() => Date, { nullable: true })
  to?: Date;

  @IsOptional()
  @IsBoolean()
  @Field(() => Boolean, { nullable: true, defaultValue: false })
  includeArchived?: boolean;
}
