import { IsNotEmpty, IsString } from 'class-validator';

export class ConsentInfoBodyDto {
  @IsNotEmpty()
  consent: string;

  @IsNotEmpty()
  @IsString()
  token: string;
}
