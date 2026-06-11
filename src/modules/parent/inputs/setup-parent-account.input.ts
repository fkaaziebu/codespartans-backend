import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { AddChildInput } from './add-child.input';

@InputType()
export class SetupParentAccountInput {
  @Field(() => [AddChildInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddChildInput)
  children: AddChildInput[];
}
