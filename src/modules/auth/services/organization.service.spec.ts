import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import {
  Admin,
  entities,
  Instructor,
  Organization,
} from '../../../database/entities';
import { HashHelper } from '../../../helpers';
import { OrganizationService } from './organization.service';

describe('OrganizationService', () => {
  let module: TestingModule;
  let connection: Connection;

  let organizationService: OrganizationService;
  let organizationRepository: Repository<Organization>;
  let adminRepository: Repository<Admin>;
  let instructorRepository: Repository<Instructor>;

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
      providers: [OrganizationService],
    }).compile();

    connection = module.get<Connection>(Connection);
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
    const entityMetadatas = connection.entityMetadatas;
    for (const entity of entityMetadatas) {
      const repository = connection.getRepository(entity.name);
      await repository.query(`TRUNCATE "${entity.tableName}" CASCADE;`);
    }
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await connection.close();
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

      const admin = await organizationService.registerAdmin({
        organizationEmail: organizationInfo.email,
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
          organizationEmail: 'nonexistent@org.com',
          name: 'Test Admin',
          email: 'admin@test.com',
          password: 'password',
        }),
      ).rejects.toThrow(new NotFoundException('Organization not found'));
    });

    it('throws an error if admin email is already registered', async () => {
      await organizationService.registerOrganization(organizationInfo);

      await organizationService.registerAdmin({
        organizationEmail: organizationInfo.email,
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password',
      });

      await expect(
        organizationService.registerAdmin({
          organizationEmail: organizationInfo.email,
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

      const instructor = await organizationService.registerInstructor({
        organizationEmail: organizationInfo.email,
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
          organizationEmail: 'nonexistent@org.com',
          name: 'Test Instructor',
          email: 'instructor@test.com',
          password: 'password',
        }),
      ).rejects.toThrow(new NotFoundException('Organization not found'));
    });

    it('throws BadRequestException if instructor email is already registered', async () => {
      await organizationService.registerOrganization(organizationInfo);

      await organizationService.registerInstructor({
        organizationEmail: organizationInfo.email,
        name: 'Test Instructor',
        email: 'instructor@test.com',
        password: 'password',
      });

      await expect(
        organizationService.registerInstructor({
          organizationEmail: organizationInfo.email,
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
