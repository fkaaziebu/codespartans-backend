import { BadRequestException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { Admin, entities, Organization } from '../../../database/entities';
import { HashHelper } from '../../../helpers';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let module: TestingModule;
  let connection: Connection;

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
      providers: [AdminService],
    }).compile();

    connection = module.get<Connection>(Connection);
    adminService = module.get<AdminService>(AdminService);
    adminRepository = module.get<Repository<Admin>>(getRepositoryToken(Admin));
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

  describe('loginAdmin', () => {
    it('returns organization with token after successfully logging in', async () => {
      await setupData();

      const response = await adminService.loginAdmin(adminInfo);

      expect(response).toBeDefined();
      expect(response.token).toBeDefined();
      expect(response.name).toBe(adminInfo.name);
      expect(response.email).toBe(adminInfo.email);
    });

    it('throws an error if email or password is incorrect', async () => {
      await setupData();

      await expect(
        adminService.loginAdmin({
          email: 'invalid@email.com',
          password: 'password',
        }),
      ).rejects.toThrowError(
        new BadRequestException('Email or password is incorrect'),
      );

      await expect(
        adminService.loginAdmin({
          email: adminInfo.email,
          password: 'invalidpassword',
        }),
      ).rejects.toThrowError(
        new BadRequestException('Email or password is incorrect'),
      );
    });
  });

  const adminInfo = {
    email: 'fkaaziebu1998@gmail.com',
    name: 'Frederick Aziebu',
    password: 'password',
  };

  const setupData = async () => {
    const organization = new Organization();
    organization.name = 'Organization Name';
    organization.email = 'fkaaziebu1998@gmail.com';
    organization.password = await HashHelper.encrypt('password');

    await organizationRepository.save(organization);

    const admin = new Admin();
    admin.name = adminInfo.name;
    admin.email = adminInfo.email;
    admin.password = await HashHelper.encrypt(adminInfo.password);
    admin.organization = organization;

    await adminRepository.save(admin);
  };
});
