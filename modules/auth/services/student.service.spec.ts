import { BadRequestException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { entities, Organization, Student } from '../../../database/entities';
import { HashHelper } from '../../../helpers';
import { StudentService } from './student.service';

describe('StudentService', () => {
  let module: TestingModule;
  let connection: Connection;

  let studentService: StudentService;
  let studentRepository: Repository<Student>;
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
      providers: [StudentService],
    }).compile();

    connection = module.get<Connection>(Connection);
    studentService = module.get<StudentService>(StudentService);
    studentRepository = module.get<Repository<Student>>(
      getRepositoryToken(Student),
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

  describe('registerStudent', () => {
    const getStudentByEmail = async (email: string) => {
      return studentRepository.findOne({
        where: { email },
        relations: ['cart'],
      });
    };

    it('returns success message after registration succeeded', async () => {
      const organization = await registerOrganization();
      const response = await studentService.registerStudent({
        ...studentInfo,
        organizationId: organization.id,
      });

      expect(response.message).toBe('Student registered successfully');

      const student = await getStudentByEmail(studentInfo.email);

      expect(student).toBeDefined();
      expect(student.email).toBe(studentInfo.email);
      expect(student.name).toBe(studentInfo.name);
      expect(student.cart).toBeDefined();
    });

    it('throws an error if email is already registered', async () => {
      const organization = await registerOrganization();
      await studentService.registerStudent({
        ...studentInfo,
        organizationId: organization.id,
      });

      await expect(
        studentService.registerStudent({
          ...studentInfo,
          organizationId: organization.id,
        }),
      ).rejects.toThrowError(
        new BadRequestException('Student with this email already exists'),
      );
    });
  });

  describe('loginStudent', () => {
    it('returns organization with token after successfully logging in', async () => {
      const organization = await registerOrganization();
      await studentService.registerStudent({
        ...studentInfo,
        organizationId: organization.id,
      });

      const response = await studentService.loginStudent(studentInfo);

      expect(response).toBeDefined();
      expect(response.token).toBeDefined();
      expect(response.name).toBe(studentInfo.name);
      expect(response.email).toBe(studentInfo.email);
    });

    it('throws an error if email or password is incorrect', async () => {
      const organization = await registerOrganization();
      await studentService.registerStudent({
        ...studentInfo,
        organizationId: organization.id,
      });

      await expect(
        studentService.loginStudent({
          email: 'invalid@email.com',
          password: 'password',
        }),
      ).rejects.toThrowError(
        new BadRequestException('Email or password is incorrect'),
      );

      await expect(
        studentService.loginStudent({
          email: studentInfo.email,
          password: 'invalidpassword',
        }),
      ).rejects.toThrowError(
        new BadRequestException('Email or password is incorrect'),
      );
    });
  });

  const studentInfo = {
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
});
