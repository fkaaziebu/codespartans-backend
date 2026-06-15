import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParsePinPipe implements PipeTransform<string> {
  transform(value: string) {
    if (!/^\d{6}$/.test(value)) {
      throw new BadRequestException('Pin must be exactly 6 digits.');
    }
    return value;
  }
}
