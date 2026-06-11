import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class VerifyChildUsernameInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  username: string;
}
