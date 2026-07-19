import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { LoggableModuleEnum, LogLevelEnum } from '../types/logging-enums.type';

@InputType()
export class SetLogLevelInput {
  @IsEnum(LoggableModuleEnum)
  @Field(() => LoggableModuleEnum)
  module: LoggableModuleEnum;

  @IsEnum(LogLevelEnum)
  @Field(() => LogLevelEnum)
  level: LogLevelEnum;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  @Field(() => Int, { nullable: true, defaultValue: 10 })
  ttlMinutes?: number;
}
