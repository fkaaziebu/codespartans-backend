import { BadRequestException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { entities, Instructor, Organization } from '../../../database/entities';
import { HashHelper } from '../../../helpers';
import { InstructorService } from './instructor.service';

describe('InstructorService', () => {
  let module: TestingModule;
  let connection: Connection;

  let instructorService: InstructorService;
  let instructorRepository: Repository<Instructor>;
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
      providers: [InstructorService],
    }).compile();

    connection = module.get<Connection>(Connection);
    instructorService = module.get<InstructorService>(InstructorService);
    instructorRepository = module.get<Repository<Instructor>>(
      getRepositoryToken(Instructor),
    );
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

  describe('loginInstructor', () => {
    it('returns organization with token after successfully logging in', async () => {
      await setupData();

      const response = await instructorService.loginInstructor(instructorInfo);

      expect(response).toBeDefined();
      expect(response.token).toBeDefined();
      expect(response.name).toBe(instructorInfo.name);
      expect(response.email).toBe(instructorInfo.email);
    });

    it('throws an error if email or password is incorrect', async () => {
      await setupData();

      await expect(
        instructorService.loginInstructor({
          email: 'invalid@email.com',
          password: 'password',
        }),
      ).rejects.toThrowError(
        new BadRequestException('Email or password is incorrect'),
      );

      await expect(
        instructorService.loginInstructor({
          email: instructorInfo.email,
          password: 'invalidpassword',
        }),
      ).rejects.toThrowError(
        new BadRequestException('Email or password is incorrect'),
      );
    });
  });

  const instructorInfo = {
    email: 'fkaaziebu1998@gmail.com',
    name: 'Frederick Aziebu',
    password: 'password',
  };

  const registerOrganization = async () => {
    const organization = new Organization();
    organization.name = 'Organization Name';
    organization.email = 'fkaaziebu1998@gmail.com';
    organization.password = await HashHelper.encrypt('password');

    return await organizationRepository.save(organization);
  };

  const setupData = async () => {
    const organization = new Organization();
    organization.name = 'Organization Name';
    organization.email = 'fkaaziebu1998@gmail.com';
    organization.password = await HashHelper.encrypt('password');

    await organizationRepository.save(organization);

    const instructor = new Instructor();
    instructor.name = instructorInfo.name;
    instructor.email = instructorInfo.email;
    instructor.password = await HashHelper.encrypt(instructorInfo.password);
    instructor.organizations = [organization];

    await instructorRepository.save(instructor);
  };
});
