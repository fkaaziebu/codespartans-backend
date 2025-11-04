import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Image } from 'src/database/entities';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Image])],
  providers: [MediaService],
  controllers: [MediaController],
})
export class MediaModule {}
