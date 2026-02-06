import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginBodyDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
