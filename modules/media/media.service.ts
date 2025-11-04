import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Image } from 'src/database/entities/image.entity';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
  ) {}

  async uploadImage({ file }: { file: Express.Multer.File }) {
    try {
      const image = new Image();

      image.path = `${uuidv4()}.${file.originalname.split('.').pop()}`;
      image.original_name = file.originalname;
      image.buffer = file.buffer;
      image.mime_type = file.mimetype;

      const savedImage = await this.imageRepository.save(image);
      return {
        message: 'Upload successful',
        path: savedImage.path,
      };
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async fetchImage({ id }: { id: string }) {
    try {
      const image = await this.imageRepository.findOne({
        where: { path: id },
      });

      return image;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }
}
