import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from './guards';
import { MediaService } from './media.service';

@Controller('v1')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/images/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.mediaService.uploadImage({ file });
  }

  @Get('/images/:imageId')
  async fetchImage(@Param('imageId') imageId: string, @Res() res: Response) {
    const image = await this.mediaService.fetchImage({ id: imageId });

    res.setHeader('Content-Type', image.mime_type);
    res.send(image.buffer);
  }
}
