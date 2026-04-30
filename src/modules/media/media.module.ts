import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Image } from './entities/image.entity';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Image])],
  providers: [MediaService],
  controllers: [MediaController],
  exports: [TypeOrmModule],
})
export class MediaModule {}
