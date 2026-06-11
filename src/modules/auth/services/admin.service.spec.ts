import { BadRequestException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Admin, entities, Organization } from '../../../database/entities';
import { HashHelper } from '../../../helpers';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let module: TestingModule;
  let dataSource: DataSource;

  let adminService: AdminService;
  let adminRepository: Repository<Admin>;
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
            secret: configService.get<string>('JWT_SECRET') || 'test-secret',
            secretOrPrivateKey:
              configService.get('JWT_SECRET') || 'test-secret',
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
      providers: [AdminService],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    adminService = module.get<AdminService>(AdminService);
    adminRepository = module.get<Repository<Admin>>(getRepositoryToken(Admin));
    organizationRepository = module.get<Repository<Organization>>(
      getRepositoryToken(Organization),
    );
  });

  beforeEach(async () => {
    const entityMetadatas = dataSource.entityMetadatas;
    for (const entity of entityMetadatas) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE "${entity.tableName}" CASCADE;`);
    }
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  const adminInfo = {
    email: 'admin@test.com',
    name: 'Test Admin',
    password: 'password',
  };

  const setupData = async () => {
    const organization = new Organization();
    organization.name = 'Test Organization';
    organization.email = 'org@test.com';
    organization.password = await HashHelper.encrypt('password');
    await organizationRepository.save(organization);

    const admin = new Admin();
    admin.name = adminInfo.name;
    admin.email = adminInfo.email;
    admin.password = await HashHelper.encrypt(adminInfo.password);
    admin.organization = organization;
    await adminRepository.save(admin);
  };

  describe('loginAdmin', () => {
    it('returns admin with token after successful login', async () => {
      await setupData();

      const response = await adminService.loginAdmin(adminInfo);

      expect(response).toBeDefined();
      expect(response.token).toBeDefined();
      expect(response.name).toBe(adminInfo.name);
      expect(response.email).toBe(adminInfo.email);
    });

    it('throws BadRequestException if email is incorrect', async () => {
      await setupData();

      await expect(
        adminService.loginAdmin({
          email: 'invalid@email.com',
          password: 'password',
        }),
      ).rejects.toThrow(
        new BadRequestException('Email or password is incorrect'),
      );
    });

    it('throws BadRequestException if password is incorrect', async () => {
      await setupData();

      await expect(
        adminService.loginAdmin({
          email: adminInfo.email,
          password: 'invalidpassword',
        }),
      ).rejects.toThrow(
        new BadRequestException('Email or password is incorrect'),
      );
    });
  });
});
