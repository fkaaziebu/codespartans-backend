import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class RequestChildPinResetInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  username: string;
}
