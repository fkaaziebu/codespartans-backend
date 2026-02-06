import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ConsentQueryDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}
