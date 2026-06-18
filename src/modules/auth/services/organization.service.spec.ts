import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Admin,
  entities,
  Instructor,
  Organization,
} from '../../../database/entities';
import { HashHelper } from '../../../helpers';
import { SignupProducer } from './signup.producer';
import { OrganizationService } from './organization.service';

describe('OrganizationService', () => {
  let module: TestingModule;
  let dataSource: DataSource;

  let organizationService: OrganizationService;
  let organizationRepository: Repository<Organization>;
  let adminRepository: Repository<Admin>;
  let instructorRepository: Repository<Instructor>;

  const mockSignupProducer = {
    enqueueFreeTrial: jest.fn().mockResolvedValue(undefined),
  };

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
      providers: [
        OrganizationService,
        {
          provide: SignupProducer,
          useValue: mockSignupProducer,
        },
      ],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    organizationService = module.get<OrganizationService>(OrganizationService);
    organizationRepository = module.get<Repository<Organization>>(
      getRepositoryToken(Organization),
    );
    adminRepository = module.get<Repository<Admin>>(getRepositoryToken(Admin));
    instructorRepository = module.get<Repository<Instructor>>(
      getRepositoryToken(Instructor),
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

  const organizationInfo = {
    email: 'org@test.com',
    name: 'Test Organization',
    password: 'password',
  };

  describe('registerOrganization', () => {
    it('returns success message and persists the organization', async () => {
      const response =
        await organizationService.registerOrganization(organizationInfo);

      expect(response.message).toBe('Organization registered successfully');

      const organization = await organizationRepository.findOne({
        where: { email: organizationInfo.email },
      });

      expect(organization).toBeDefined();
      expect(organization.email).toBe(organizationInfo.email);
      expect(organization.name).toBe(organizationInfo.name);
    });

    it('throws an error if email is already registered', async () => {
      await organizationService.registerOrganization(organizationInfo);

      await expect(
        organizationService.registerOrganization(organizationInfo),
      ).rejects.toThrow('Organization with this email already exists');
    });

    it('enqueues a free trial job after successful registration', async () => {
      await organizationService.registerOrganization(organizationInfo);

      expect(mockSignupProducer.enqueueFreeTrial).toHaveBeenCalledWith({
        email: organizationInfo.email,
        role: 'ORGANIZATION',
      });
    });
  });

  describe('loginOrganization', () => {
    it('returns organization with token after successful login', async () => {
      await organizationService.registerOrganization(organizationInfo);

      const response =
        await organizationService.loginOrganization(organizationInfo);

      expect(response).toBeDefined();
      expect(response.token).toBeDefined();
      expect(response.name).toBe(organizationInfo.name);
      expect(response.email).toBe(organizationInfo.email);
    });

    it('throws BadRequestException if email is incorrect', async () => {
      await organizationService.registerOrganization(organizationInfo);

      await expect(
        organizationService.loginOrganization({
          email: 'invalid@email.com',
          password: 'password',
        }),
      ).rejects.toThrow(
        new BadRequestException('Email or password is incorrect'),
      );
    });

    it('throws BadRequestException if password is incorrect', async () => {
      await organizationService.registerOrganization(organizationInfo);

      await expect(
        organizationService.loginOrganization({
          email: organizationInfo.email,
          password: 'invalidpassword',
        }),
      ).rejects.toThrow(
        new BadRequestException('Email or password is incorrect'),
      );
    });
  });

  describe('registerAdmin', () => {
    it('creates and returns an admin for an existing organization', async () => {
      await organizationService.registerOrganization(organizationInfo);
      const org = await organizationRepository.findOne({
        where: { email: organizationInfo.email },
      });

      const admin = await organizationService.registerAdmin({
        organizationId: org.id,
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password',
      });

      expect(admin).toBeDefined();
      expect(admin.name).toBe('Test Admin');
      expect(admin.email).toBe('admin@test.com');

      const savedAdmin = await adminRepository.findOne({
        where: { email: 'admin@test.com' },
        relations: ['organization'],
      });
      expect(savedAdmin).toBeDefined();
      expect(savedAdmin.organization.email).toBe(organizationInfo.email);
    });

    it('throws NotFoundException if organization is not found', async () => {
      await expect(
        organizationService.registerAdmin({
          organizationId: '00000000-0000-0000-0000-000000000000',
          name: 'Test Admin',
          email: 'admin@test.com',
          password: 'password',
        }),
      ).rejects.toThrow(new NotFoundException('Organization not found'));
    });

    it('throws an error if admin email is already registered', async () => {
      await organizationService.registerOrganization(organizationInfo);
      const org = await organizationRepository.findOne({
        where: { email: organizationInfo.email },
      });

      await organizationService.registerAdmin({
        organizationId: org.id,
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password',
      });

      await expect(
        organizationService.registerAdmin({
          organizationId: org.id,
          name: 'Another Admin',
          email: 'admin@test.com',
          password: 'password',
        }),
      ).rejects.toThrow('Admin with this email already exists');
    });
  });

  describe('registerInstructor', () => {
    it('creates and returns an instructor for an existing organization', async () => {
      await organizationService.registerOrganization(organizationInfo);
      const org = await organizationRepository.findOne({
        where: { email: organizationInfo.email },
      });

      const instructor = await organizationService.registerInstructor({
        organizationId: org.id,
        name: 'Test Instructor',
        email: 'instructor@test.com',
        password: 'password',
      });

      expect(instructor).toBeDefined();
      expect(instructor.name).toBe('Test Instructor');
      expect(instructor.email).toBe('instructor@test.com');

      const savedInstructor = await instructorRepository.findOne({
        where: { email: 'instructor@test.com' },
        relations: ['organizations'],
      });
      expect(savedInstructor).toBeDefined();
      expect(savedInstructor.organizations[0].email).toBe(organizationInfo.email);
    });

    it('throws NotFoundException if organization is not found', async () => {
      await expect(
        organizationService.registerInstructor({
          organizationId: '00000000-0000-0000-0000-000000000000',
          name: 'Test Instructor',
          email: 'instructor@test.com',
          password: 'password',
        }),
      ).rejects.toThrow(new NotFoundException('Organization not found'));
    });

    it('throws BadRequestException if instructor email is already registered', async () => {
      await organizationService.registerOrganization(organizationInfo);
      const org = await organizationRepository.findOne({
        where: { email: organizationInfo.email },
      });

      await organizationService.registerInstructor({
        organizationId: org.id,
        name: 'Test Instructor',
        email: 'instructor@test.com',
        password: 'password',
      });

      await expect(
        organizationService.registerInstructor({
          organizationId: org.id,
          name: 'Another Instructor',
          email: 'instructor@test.com',
          password: 'password',
        }),
      ).rejects.toThrow(
        new BadRequestException('Instructor with this email already exists'),
      );
    });
  });
});
