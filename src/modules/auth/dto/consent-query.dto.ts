import { IsNotEmpty, IsString } from 'class-validator';

export class ConsentQueryDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}
