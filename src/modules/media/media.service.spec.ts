import { BadRequestException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { entities, Image } from '../../database/entities';
import { MediaService } from './media.service';

describe('MediaService', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let mediaService: MediaService;
  let imageRepository: Repository<Image>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test.local',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            type: 'postgres',
            url: configService.get<string>('DATABASE_URL'),
            entities,
            synchronize: true,
          }),
          inject: [ConfigService],
        }),
        TypeOrmModule.forFeature(entities),
      ],
      providers: [MediaService],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    mediaService = module.get<MediaService>(MediaService);
    imageRepository = module.get<Repository<Image>>(getRepositoryToken(Image));
  });

  beforeEach(async () => {
    const entityMetadatas = dataSource.entityMetadatas;
    for (const entity of entityMetadatas) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE "${entity.tableName}" CASCADE;`);
    }
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  // ─── helpers ────────────────────────────────────────────────────────────────

  const makeFile = (name = 'test.png', mime = 'image/png'): Express.Multer.File =>
    ({
      originalname: name,
      mimetype: mime,
      buffer: Buffer.from('fake-image-data'),
      fieldname: 'file',
      encoding: '7bit',
      size: 16,
      stream: null,
      destination: '',
      filename: name,
      path: '',
    } as Express.Multer.File);

  // ─── uploadImage ─────────────────────────────────────────────────────────────

  describe('uploadImage', () => {
    it('returns success message and a generated path', async () => {
      const file = makeFile();

      const result = await mediaService.uploadImage({ file });

      expect(result.message).toBe('Upload successful');
      expect(result.path).toBeDefined();
      expect(result.path).toMatch(/\.png$/);
    });

    it('persists the image record to the database', async () => {
      const file = makeFile('photo.jpg', 'image/jpeg');

      const result = await mediaService.uploadImage({ file });

      const saved = await imageRepository.findOne({
        where: { path: result.path },
      });

      expect(saved).toBeDefined();
      expect(saved.original_name).toBe('photo.jpg');
      expect(saved.mime_type).toBe('image/jpeg');
      expect(saved.buffer).toBeDefined();
    });

    it('generates unique paths for multiple uploads of the same filename', async () => {
      const file = makeFile('same.png');

      const result1 = await mediaService.uploadImage({ file });
      const result2 = await mediaService.uploadImage({ file });

      expect(result1.path).not.toBe(result2.path);
    });
  });

  // ─── fetchImage ──────────────────────────────────────────────────────────────

  describe('fetchImage', () => {
    it('returns the image record for a known path', async () => {
      const file = makeFile('fetchme.png');
      const { path } = await mediaService.uploadImage({ file });

      const result = await mediaService.fetchImage({ id: path });

      expect(result).toBeDefined();
      expect(result.path).toBe(path);
      expect(result.original_name).toBe('fetchme.png');
    });

    it('returns null (undefined) for an unknown path', async () => {
      const result = await mediaService.fetchImage({ id: 'nonexistent-uuid.png' });

      expect(result).toBeNull();
    });
  });
});
