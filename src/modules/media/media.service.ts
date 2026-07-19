import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Image } from './entities/image.entity';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';

@Injectable()
export class MediaService {
  private readonly log = this.loggerRegistry.getLogger('media');

  constructor(
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
    private readonly loggerRegistry: ModuleLoggerRegistry,
  ) {}

  async uploadImage({ file }: { file: Express.Multer.File }) {
    try {
      const image = new Image();

      image.path = `${uuidv4()}.${file.originalname.split('.').pop()}`;
      image.original_name = file.originalname;
      image.buffer = file.buffer;
      image.mime_type = file.mimetype;

      const savedImage = await this.imageRepository.save(image);

      this.log.info(
        {
          path: savedImage.path,
          mimeType: file.mimetype,
          sizeBytes: file.buffer.length,
        },
        'media.image.uploaded',
      );

      return {
        message: 'Upload successful',
        path: savedImage.path,
      };
    } catch (err) {
      this.log.error({ err: err.message }, 'media.image.upload_failed');
      throw new BadRequestException(err);
    }
  }

  async fetchImage({ id }: { id: string }) {
    try {
      const image = await this.imageRepository.findOne({
        where: { path: id },
      });

      if (!image) {
        this.log.warn({ path: id }, 'media.image.not_found');
      }

      return image;
    } catch (err) {
      this.log.error({ path: id, err: err.message }, 'media.image.fetch_failed');
      throw new BadRequestException(err);
    }
  }
}
