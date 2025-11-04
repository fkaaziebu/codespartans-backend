import { BadRequestException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { entities, Organization } from '../../../database/entities';
import { OrganizationService } from './organization.service';

describe('OrganizationService', () => {
  let module: TestingModule;
  let connection: Connection;

  let organizationService: OrganizationService;
  let organizationRepository: Repository<Organization>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test.local',
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET'),
            secretOrPrivateKey: configService.get('JWT_SECRET'),
            signOptions: { expiresIn: '1h' },
          }),
          inject: [ConfigService],
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
      controllers: [],
      providers: [OrganizationService],
    }).compile();

    connection = module.get<Connection>(Connection);
    organizationService = module.get<OrganizationService>(OrganizationService);
    organizationRepository = module.get<Repository<Organization>>(
      getRepositoryToken(Organization),
    );
  });

  beforeEach(async () => {
    // Clear the database before each test
    const entities = connection.entityMetadatas;
    for (const entity of entities) {
      const repository = connection.getRepository(entity.name);
      await repository.query(`TRUNCATE "${entity.tableName}" CASCADE;`);
    }
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await connection.close();
    await module.close();
  });

  describe('registerOrganization', () => {
    const getOrganizationByEmail = async (email: string) => {
      return organizationRepository.findOne({ where: { email } });
    };

    it('returns success message after registration succeeded', async () => {
      const response =
        await organizationService.registerOrganization(organizationInfo);

      expect(response.message).toBe('Organization registered successfully');

      const organization = await getOrganizationByEmail(organizationInfo.email);

      expect(organization).toBeDefined();
      expect(organization.email).toBe(organizationInfo.email);
      expect(organization.name).toBe(organizationInfo.name);
    });

    it('throws an error if email is already registered', async () => {
      await organizationService.registerOrganization(organizationInfo);

      await expect(
        organizationService.registerOrganization(organizationInfo),
      ).rejects.toThrowError(
        new BadRequestException('Organization with this email already exists'),
      );
    });
  });

  describe('loginOrganization', () => {
    it('returns organization with token after successfully logging in', async () => {
      await organizationService.registerOrganization(organizationInfo);

      const response =
        await organizationService.loginOrganization(organizationInfo);

      expect(response).toBeDefined();
      expect(response.token).toBeDefined();
      expect(response.name).toBe(organizationInfo.name);
      expect(response.email).toBe(organizationInfo.email);
    });

    it('throws an error if email or password is incorrect', async () => {
      await organizationService.registerOrganization(organizationInfo);

      await expect(
        organizationService.loginOrganization({
          email: 'invalid@email.com',
          password: 'password',
        }),
      ).rejects.toThrowError(
        new BadRequestException('Email or password is incorrect'),
      );

      await expect(
        organizationService.loginOrganization({
          email: organizationInfo.email,
          password: 'invalidpassword',
        }),
      ).rejects.toThrowError(
        new BadRequestException('Email or password is incorrect'),
      );
    });
  });

  const organizationInfo = {
    organizationEmail: 'fkaaziebu1998@gmail.com',
    email: 'fkaaziebu1998@gmail.com',
    name: 'Frederick Aziebu',
    password: 'password',
  };
});
