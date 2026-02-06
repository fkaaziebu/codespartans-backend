import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ConsentInfoBodyDto {
  @IsNotEmpty()
  consent: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}
