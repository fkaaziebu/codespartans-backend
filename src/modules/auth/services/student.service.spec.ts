import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { entities, Organization, Student } from '../../../database/entities';
import { HashHelper } from '../../../helpers';
import { LoginBodyDto } from '../dto/login-body.dto';
import { EmailProducer } from './email.producer';
import { SignupProducer } from './signup.producer';
import { StudentService } from './student.service';

const GENPOP_EMAIL = 'genpop@codespartans.com';

describe('StudentService', () => {
  let module: TestingModule;
  let connection: Connection;
  let studentService: StudentService;
  let studentRepository: Repository<Student>;
  let organizationRepository: Repository<Organization>;

  const mockEmailProducer = {
    sendAccountValidationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockSignupProducer = {
    enqueueFreeTrial: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    process.env.GENPOP_EMAIL = GENPOP_EMAIL;

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
        StudentService,
        { provide: EmailProducer, useValue: mockEmailProducer },
        { provide: SignupProducer, useValue: mockSignupProducer },
      ],
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
    const entityMetadatas = connection.entityMetadatas;
    for (const entity of entityMetadatas) {
      const repository = connection.getRepository(entity.name);
      await repository.query(`TRUNCATE "${entity.tableName}" CASCADE;`);
    }
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await connection.close();
    await module.close();
  });

  const studentInfo = {
    email: 'student@test.com',
    name: 'Test Student',
    password: 'password',
  };

  const seedGenpopOrganization = async () => {
    const organization = new Organization();
    organization.name = 'General Population';
    organization.email = GENPOP_EMAIL;
    organization.password = await HashHelper.encrypt('password');
    return organizationRepository.save(organization);
  };

  const registerAndValidateStudent = async () => {
    await seedGenpopOrganization();
    await studentService.registerStudent(studentInfo);
    const student = await studentRepository.findOne({
      where: { email: studentInfo.email },
    });
    student.is_account_validated = true;
    student.validation_code = null;
    return studentRepository.save(student);
  };

  describe('registerStudent', () => {
    it('returns success message and creates student with cart and organization', async () => {
      await seedGenpopOrganization();

      const response = await studentService.registerStudent(studentInfo);

      expect(response.message).toBe('Student registered successfully');

      const student = await studentRepository.findOne({
        where: { email: studentInfo.email },
        relations: ['cart', 'organizations'],
      });

      expect(student).toBeDefined();
      expect(student.email).toBe(studentInfo.email);
      expect(student.name).toBe(studentInfo.name);
      expect(student.cart).toBeDefined();
      expect(student.organizations).toHaveLength(1);
      expect(student.is_account_validated).toBe(false);
      expect(mockEmailProducer.sendAccountValidationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: studentInfo.email,
          name: studentInfo.name,
        }),
      );
    });

    it('throws an error if email is already registered', async () => {
      await seedGenpopOrganization();
      await studentService.registerStudent(studentInfo);

      await expect(
        studentService.registerStudent(studentInfo),
      ).rejects.toThrow('Student with this email already exists');
    });

    it('throws an error if GENPOP organization is not found', async () => {
      await expect(
        studentService.registerStudent(studentInfo),
      ).rejects.toThrow('Organization not found');
    });
  });

  describe('loginStudent', () => {
    it('returns student with token and refresh_token after successful login', async () => {
      await registerAndValidateStudent();

      const response = await studentService.loginStudent(studentInfo);

      expect(response).toBeDefined();
      expect(response.token).toBeDefined();
      expect(response.refresh_token).toBeDefined();
      expect(response.name).toBe(studentInfo.name);
      expect(response.email).toBe(studentInfo.email);
    });

    it('throws BadRequestException if email is incorrect', async () => {
      await registerAndValidateStudent();

      await expect(
        studentService.loginStudent({
          email: 'wrong@email.com',
          password: studentInfo.password,
        }),
      ).rejects.toThrow(
        new BadRequestException('Email or password is incorrect'),
      );
    });

    it('throws BadRequestException if password is incorrect', async () => {
      await registerAndValidateStudent();

      await expect(
        studentService.loginStudent({
          email: studentInfo.email,
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(
        new BadRequestException('Email or password is incorrect'),
      );
    });

    it('throws BadRequestException if account is not verified', async () => {
      await seedGenpopOrganization();
      await studentService.registerStudent(studentInfo);

      await expect(
        studentService.loginStudent(studentInfo),
      ).rejects.toThrow(
        new BadRequestException(
          'Account not verified. Please check your email for the verification code.',
        ),
      );
    });
  });

  describe('studentProfile', () => {
    it('returns the student with organizations', async () => {
      await registerAndValidateStudent();

      const profile = await studentService.studentProfile({
        email: studentInfo.email,
      });

      expect(profile).toBeDefined();
      expect(profile.email).toBe(studentInfo.email);
      expect(profile.organizations).toBeDefined();
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.studentProfile({ email: 'nonexistent@test.com' }),
      ).rejects.toThrow(new NotFoundException('Student does not exist'));
    });
  });

  describe('listOrganizations', () => {
    it('returns all organizations when no searchTerm', async () => {
      await seedGenpopOrganization();

      const result = await studentService.listOrganizations({ searchTerm: '' });

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe(GENPOP_EMAIL);
    });

    it('filters organizations by searchTerm', async () => {
      await seedGenpopOrganization();

      const matchingResult = await studentService.listOrganizations({
        searchTerm: 'General',
      });
      expect(matchingResult).toHaveLength(1);

      const emptyResult = await studentService.listOrganizations({
        searchTerm: 'NonExistentOrg',
      });
      expect(emptyResult).toHaveLength(0);
    });
  });

  describe('listOrganizationsPaginated', () => {
    it('returns paginated organizations with edges and pageInfo', async () => {
      await seedGenpopOrganization();

      const result = await studentService.listOrganizationsPaginated({
        searchTerm: '',
      });

      expect(result).toBeDefined();
      expect(result.edges).toHaveLength(1);
      expect(result.pageInfo).toBeDefined();
      expect(result.count).toBe(1);
    });
  });

  describe('completeStudentAccountValidation', () => {
    it('validates the account with the correct code', async () => {
      await seedGenpopOrganization();
      await studentService.registerStudent(studentInfo);

      const student = await studentRepository.findOne({
        where: { email: studentInfo.email },
      });

      const response = await studentService.completeStudentAccountValidation({
        email: studentInfo.email,
        validation_code: student.validation_code,
      });

      expect(response.message).toBe('Account verified successfully');

      const updatedStudent = await studentRepository.findOne({
        where: { email: studentInfo.email },
      });
      expect(updatedStudent.is_account_validated).toBe(true);
      expect(updatedStudent.validation_code).toBeNull();
    });

    it('returns "already verified" message if account is already validated', async () => {
      await registerAndValidateStudent();

      const response = await studentService.completeStudentAccountValidation({
        email: studentInfo.email,
        validation_code: 'anycode',
      });

      expect(response.message).toBe('Account already verified');
    });

    it('throws BadRequestException for an invalid verification code', async () => {
      await seedGenpopOrganization();
      await studentService.registerStudent(studentInfo);

      await expect(
        studentService.completeStudentAccountValidation({
          email: studentInfo.email,
          validation_code: 'wrongcode',
        }),
      ).rejects.toThrow(new BadRequestException('Invalid verification code'));
    });

    it('throws NotFoundException if student is not found', async () => {
      await expect(
        studentService.completeStudentAccountValidation({
          email: 'nonexistent@test.com',
          validation_code: '123456',
        }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });

    it('enqueues a free trial job after successful validation', async () => {
      await seedGenpopOrganization();
      await studentService.registerStudent(studentInfo);

      const student = await studentRepository.findOne({
        where: { email: studentInfo.email },
      });

      await studentService.completeStudentAccountValidation({
        email: studentInfo.email,
        validation_code: student.validation_code,
      });

      expect(mockSignupProducer.enqueueFreeTrial).toHaveBeenCalledWith({
        email: studentInfo.email,
        role: 'STUDENT',
      });
    });

    it('does not enqueue a free trial if account was already verified', async () => {
      await registerAndValidateStudent();

      await studentService.completeStudentAccountValidation({
        email: studentInfo.email,
        validation_code: 'anycode',
      });

      expect(mockSignupProducer.enqueueFreeTrial).not.toHaveBeenCalled();
    });
  });

  describe('resendAccountValidationCode', () => {
    it('resends the validation code and sends an email', async () => {
      await seedGenpopOrganization();
      await studentService.registerStudent(studentInfo);

      const response = await studentService.resendAccountValidationCode({
        email: studentInfo.email,
      });

      expect(response.message).toBe('Verification code resent successfully');
      // once for register, once for resend
      expect(mockEmailProducer.sendAccountValidationEmail).toHaveBeenCalledTimes(2);
    });

    it('throws NotFoundException if student is not found', async () => {
      await expect(
        studentService.resendAccountValidationCode({
          email: 'nonexistent@test.com',
        }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });

    it('throws BadRequestException if account is already verified', async () => {
      await registerAndValidateStudent();

      await expect(
        studentService.resendAccountValidationCode({ email: studentInfo.email }),
      ).rejects.toThrow(
        new BadRequestException('Account is already verified'),
      );
    });
  });

  describe('refreshStudentToken', () => {
    it('returns a new access_token for a valid refresh_token', async () => {
      await registerAndValidateStudent();

      const loginResponse = await studentService.loginStudent(studentInfo);
      const result = await studentService.refreshStudentToken({
        refresh_token: loginResponse.refresh_token,
      });

      expect(result.access_token).toBeDefined();
    });

    it('throws BadRequestException for an invalid or malformed token', async () => {
      await expect(
        studentService.refreshStudentToken({
          refresh_token: 'invalid.token.here',
        }),
      ).rejects.toThrow(
        new BadRequestException('Invalid or expired refresh token'),
      );
    });

    it('throws BadRequestException if token type is not "refresh"', async () => {
      await registerAndValidateStudent();

      const loginResponse = await studentService.loginStudent(studentInfo);

      await expect(
        studentService.refreshStudentToken({
          refresh_token: loginResponse.token,
        }),
      ).rejects.toThrow(new BadRequestException('Invalid token type'));
    });
  });

  describe('requestStudentPasswordReset', () => {
    it('returns success message even when student does not exist (no information leak)', async () => {
      const response = await studentService.requestStudentPasswordReset({
        email: 'nonexistent@test.com',
      });

      expect(response.message).toBe('Password reset link sent to your email');
      expect(mockEmailProducer.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('sets reset_token on student and sends password reset email', async () => {
      await registerAndValidateStudent();

      const response = await studentService.requestStudentPasswordReset({
        email: studentInfo.email,
      });

      expect(response.message).toBe('Password reset link sent to your email');
      expect(mockEmailProducer.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: studentInfo.email }),
      );

      const student = await studentRepository.findOne({
        where: { email: studentInfo.email },
      });
      expect(student.reset_token).toBeDefined();
      expect(student.reset_token).not.toBe('');
    });
  });

  describe('resetStudentPassword', () => {
    it('resets the password with a valid token', async () => {
      await registerAndValidateStudent();
      await studentService.requestStudentPasswordReset({
        email: studentInfo.email,
      });

      const student = await studentRepository.findOne({
        where: { email: studentInfo.email },
      });

      const response = await studentService.resetStudentPassword({
        email: studentInfo.email,
        password: 'newpassword',
        token: student.reset_token,
      });

      expect(response.message).toBe('Password reset is successful');

      const updatedStudent = await studentRepository.findOne({
        where: { email: studentInfo.email },
      });
      expect(updatedStudent.reset_token).toBe('');
      expect(
        await HashHelper.compare('newpassword', updatedStudent.password),
      ).toBe(true);
    });

    it('throws BadRequestException for an invalid reset token', async () => {
      await registerAndValidateStudent();

      await expect(
        studentService.resetStudentPassword({
          email: studentInfo.email,
          password: 'newpassword',
          token: 'invalid-token',
        }),
      ).rejects.toThrow(
        new BadRequestException('Invalid Password reset details'),
      );
    });

    it('throws BadRequestException if student does not exist', async () => {
      await expect(
        studentService.resetStudentPassword({
          email: 'nonexistent@test.com',
          password: 'newpassword',
          token: 'any-token',
        }),
      ).rejects.toThrow(
        new BadRequestException('Invalid Password reset details'),
      );
    });
  });

  describe('validateGoogleUser', () => {
    it('returns the student when the email exists', async () => {
      await registerAndValidateStudent();

      const result = await studentService.validateGoogleUser({
        email: studentInfo.email,
      } as LoginBodyDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(studentInfo.email);
    });

    it('returns null when the student does not exist', async () => {
      const result = await studentService.validateGoogleUser({
        email: 'nonexistent@test.com',
      } as LoginBodyDto);

      expect(result).toBeNull();
    });
  });

  describe('createGoogleUser', () => {
    it('creates a new student and returns a JWT payload', async () => {
      await seedGenpopOrganization();

      const result = await studentService.createGoogleUser({
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@gmail.com',
      });

      expect(result).toBeDefined();
      expect(result.email).toBe('johndoe@gmail.com');
      expect(result.name).toBe('John Doe');
      expect(result.role).toBe('STUDENT');
      expect(result.organizationId).toBeDefined();
      expect(mockEmailProducer.sendAccountValidationEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'johndoe@gmail.com' }),
      );
    });

    it('throws BadRequestException if email already exists', async () => {
      await registerAndValidateStudent();

      await expect(
        studentService.createGoogleUser({
          firstName: 'Test',
          lastName: 'Student',
          email: studentInfo.email,
        }),
      ).rejects.toThrow(new BadRequestException('Email already exist'));
    });

    it('throws an error if GENPOP organization is not found', async () => {
      await expect(
        studentService.createGoogleUser({
          firstName: 'John',
          lastName: 'Doe',
          email: 'johndoe@gmail.com',
        }),
      ).rejects.toThrow('Organization not found');
    });
  });
});
