import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Cart,
  Child,
  entities,
  Organization,
  Student,
} from '../../../database/entities';
import { HashHelper } from '../../../helpers';
import { LoginBodyDto } from '../dto/login-body.dto';
import { ClassLevel } from '../../parent/entities/child.entity';
import { AccountStatus } from '../types/account-deletion-response.type';
import { AccountDeletionService } from './account-deletion.service';
import { EmailProducer } from './email.producer';
import { SignupProducer } from './signup.producer';
import { StudentService } from './student.service';

const GENPOP_EMAIL = 'genpop@codespartans.com';

describe('StudentService', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let studentService: StudentService;
  let studentRepository: Repository<Student>;
  let organizationRepository: Repository<Organization>;
  let childRepository: Repository<Child>;
  let cartRepository: Repository<Cart>;

  const mockEmailProducer = {
    sendAccountValidationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    sendAccountRestoredNotice: jest.fn().mockResolvedValue(undefined),
    sendCancellationOtpEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockSignupProducer = {
    enqueueFreeTrial: jest.fn().mockResolvedValue(undefined),
  };

  const mockAccountDeletionService = {
    restoreStudent: jest.fn().mockResolvedValue(undefined),
  };

  const mockCacheManager = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
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
        { provide: AccountDeletionService, useValue: mockAccountDeletionService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    studentService = module.get<StudentService>(StudentService);
    studentRepository = module.get<Repository<Student>>(getRepositoryToken(Student));
    organizationRepository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    childRepository = module.get<Repository<Child>>(getRepositoryToken(Child));
    cartRepository = module.get<Repository<Cart>>(getRepositoryToken(Cart));
  });

  beforeEach(async () => {
    const entityMetadatas = dataSource.entityMetadatas;
    for (const entity of entityMetadatas) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE "${entity.tableName}" CASCADE;`);
    }
    jest.clearAllMocks();
    // Reset cache mock to default (no cached values)
    mockCacheManager.get.mockResolvedValue(null);
  });

  afterAll(async () => {
    await dataSource.destroy();
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

  /** Create a child account linked to a given student */
  const createChildForStudent = async (student: Student) => {
    const org = await seedGenpopOrganization();
    const cart = await cartRepository.save(new Cart());

    const childStudent = new Student();
    childStudent.name = 'Child Student';
    childStudent.email = `${student.email}.child@child.local`;
    childStudent.password = await HashHelper.encrypt('1234');
    childStudent.is_account_validated = true;
    childStudent.cart = cart;
    childStudent.organizations = [org];
    await studentRepository.save(childStudent);

    const { Parent } = await import('../../parent/entities/parent.entity');
    const { Gender } = await import('../../parent/entities/parent.entity');
    const { parentRepository: pr } = { parentRepository: dataSource.getRepository(Parent) };
    const parent = pr.create({
      first_name: 'Test',
      last_name: 'Parent',
      email: 'testparent@test.com',
      whatsapp_number: '+233501234567',
      gender: Gender.Male,
      password: await HashHelper.encrypt('pass'),
      is_account_validated: true,
    });
    await pr.save(parent);

    const childRepo = dataSource.getRepository(Child);
    const child = childRepo.create({
      full_name: 'Child One',
      class_level: ClassLevel.JHS1,
      target_exam: '00000000-0000-0000-0000-000000000001',
      username: 'child.one99',
      pin: await HashHelper.encrypt('1234'),
      parent,
      student: childStudent,
    });
    await childRepo.save(child);

    return { child, childStudent };
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

    it('throws BadRequestException if account was deactivated more than 90 days ago', async () => {
      await registerAndValidateStudent();
      const ninetyOneDaysAgo = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);
      await studentRepository.update(
        { email: studentInfo.email },
        { is_deactivated: true, deactivated_at: ninetyOneDaysAgo },
      );

      await expect(
        studentService.loginStudent(studentInfo),
      ).rejects.toThrow(
        new BadRequestException('This account no longer exists.'),
      );
    });

    it('returns pending-deletion token and sends OTP when deactivated within grace period', async () => {
      await registerAndValidateStudent();
      await studentRepository.update(
        { email: studentInfo.email },
        {
          is_deactivated: true,
          deactivated_at: new Date(),
          deletion_job_id: 'job-to-cancel',
        },
      );

      const response = await studentService.loginStudent(studentInfo);

      expect(response.token).toBeDefined();
      expect(response.account_status).toBe(AccountStatus.PENDING_DELETION);
      expect(response.deletion_scheduled_for).toBeInstanceOf(Date);
      expect(mockEmailProducer.sendCancellationOtpEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: studentInfo.email }),
      );
      expect(mockAccountDeletionService.restoreStudent).not.toHaveBeenCalled();
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

    it('throws UnauthorizedException when account is deactivated', async () => {
      await registerAndValidateStudent();
      const loginResponse = await studentService.loginStudent(studentInfo);

      // Simulate deactivation flag in cache
      mockCacheManager.get.mockResolvedValueOnce('1');

      await expect(
        studentService.refreshStudentToken({
          refresh_token: loginResponse.refresh_token,
        }),
      ).rejects.toThrow(new UnauthorizedException('Account has been deactivated'));
    });

    it('throws UnauthorizedException when password was recently changed', async () => {
      await registerAndValidateStudent();
      const loginResponse = await studentService.loginStudent(studentInfo);

      // First call (deactivated check) returns null, second (pw_changed) returns a future timestamp
      // so that payload.iat < Number(pwChanged) is true and the token is rejected
      mockCacheManager.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(String(Math.floor(Date.now() / 1000) + 3600));

      await expect(
        studentService.refreshStudentToken({
          refresh_token: loginResponse.refresh_token,
        }),
      ).rejects.toThrow(
        new UnauthorizedException('Password was recently changed. Please log in again.'),
      );
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
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('pw_changed:'),
        expect.stringMatching(/^\d+$/),
        expect.any(Number),
      );
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

  describe('changePassword', () => {
    it('changes the password and sets pw_changed cache flag', async () => {
      await registerAndValidateStudent();

      const response = await studentService.changePassword({
        email: studentInfo.email,
        currentPassword: studentInfo.password,
        newPassword: 'newSecurePassword',
      });

      expect(response.message).toBe('Password changed successfully');

      const updated = await studentRepository.findOne({
        where: { email: studentInfo.email },
      });
      expect(await HashHelper.compare('newSecurePassword', updated.password)).toBe(true);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('pw_changed:'),
        expect.stringMatching(/^\d+$/),
        expect.any(Number),
      );
    });

    it('throws BadRequestException if current password is incorrect', async () => {
      await registerAndValidateStudent();

      await expect(
        studentService.changePassword({
          email: studentInfo.email,
          currentPassword: 'wrongpassword',
          newPassword: 'newpass',
        }),
      ).rejects.toThrow(new BadRequestException('Current password is incorrect'));
    });

    it('throws BadRequestException if student does not exist', async () => {
      await expect(
        studentService.changePassword({
          email: 'nobody@test.com',
          currentPassword: 'any',
          newPassword: 'new',
        }),
      ).rejects.toThrow(new BadRequestException('Invalid credentials'));
    });
  });

  describe('changePin', () => {
    it('changes the pin for a child-linked student', async () => {
      const org = await seedGenpopOrganization();
      const cart = await cartRepository.save(new Cart());

      const childStudent = new Student();
      childStudent.name = 'Child Student';
      childStudent.email = 'child@child.local';
      childStudent.password = await HashHelper.encrypt('1234');
      childStudent.is_account_validated = true;
      childStudent.cart = cart;
      childStudent.organizations = [org];
      await studentRepository.save(childStudent);

      const { Parent } = await import('../../parent/entities/parent.entity');
      const { Gender } = await import('../../parent/entities/parent.entity');
      const parentRepo = dataSource.getRepository(Parent);
      const parent = parentRepo.create({
        first_name: 'Test',
        last_name: 'Parent',
        email: 'pinparent@test.com',
        whatsapp_number: '+233501234567',
        gender: Gender.Male,
        password: await HashHelper.encrypt('pass'),
        is_account_validated: true,
      });
      await parentRepo.save(parent);

      const child = childRepository.create({
        full_name: 'Child One',
        class_level: ClassLevel.JHS1,
        target_exam: '00000000-0000-0000-0000-000000000001',
        username: 'child.pin99',
        pin: await HashHelper.encrypt('1234'),
        parent,
        student: childStudent,
      });
      await childRepository.save(child);

      const response = await studentService.changePin({
        email: childStudent.email,
        currentPin: '1234',
        newPin: '5678',
      });

      expect(response.message).toBe('Pin changed successfully');

      const updatedChild = await childRepository.findOne({ where: { id: child.id } });
      expect(await HashHelper.compare('5678', updatedChild.pin)).toBe(true);
    });

    it('throws UnauthorizedException if current pin is incorrect', async () => {
      const org = await seedGenpopOrganization();
      const cart = await cartRepository.save(new Cart());

      const childStudent = new Student();
      childStudent.name = 'Child Student 2';
      childStudent.email = 'child2@child.local';
      childStudent.password = await HashHelper.encrypt('1234');
      childStudent.is_account_validated = true;
      childStudent.cart = cart;
      childStudent.organizations = [org];
      await studentRepository.save(childStudent);

      const { Parent } = await import('../../parent/entities/parent.entity');
      const { Gender } = await import('../../parent/entities/parent.entity');
      const parentRepo = dataSource.getRepository(Parent);
      const parent = parentRepo.create({
        first_name: 'Parent',
        last_name: 'Two',
        email: 'pinparent2@test.com',
        whatsapp_number: '+233501234568',
        gender: Gender.Female,
        password: await HashHelper.encrypt('pass'),
        is_account_validated: true,
      });
      await parentRepo.save(parent);

      const child = childRepository.create({
        full_name: 'Child Two',
        class_level: ClassLevel.JHS1,
        target_exam: '00000000-0000-0000-0000-000000000001',
        username: 'child.pin2x',
        pin: await HashHelper.encrypt('1234'),
        parent,
        student: childStudent,
      });
      await childRepository.save(child);

      await expect(
        studentService.changePin({
          email: childStudent.email,
          currentPin: '0000',
          newPin: '5678',
        }),
      ).rejects.toThrow(new UnauthorizedException('Current pin is incorrect'));
    });

    it('throws BadRequestException if no child found for the email', async () => {
      await expect(
        studentService.changePin({
          email: 'nobody@child.local',
          currentPin: '1234',
          newPin: '5678',
        }),
      ).rejects.toThrow(new BadRequestException('Child account not found'));
    });
  });

  describe('verifyCancellationOtp', () => {
    it('returns success when OTP matches the cache', async () => {
      await registerAndValidateStudent();
      const student = await studentRepository.findOne({
        where: { email: studentInfo.email },
      });

      mockCacheManager.get.mockResolvedValueOnce('123456');

      const result = await studentService.verifyCancellationOtp(student.id, '123456');

      expect(result.message).toContain('OTP verified');
      expect(mockCacheManager.del).toHaveBeenCalledWith(`cancel_otp:${student.id}`);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `cancel_otp_verified:${student.id}`,
        '1',
        expect.any(Number),
      );
    });

    it('throws BadRequestException if OTP does not match', async () => {
      await registerAndValidateStudent();
      const student = await studentRepository.findOne({
        where: { email: studentInfo.email },
      });

      mockCacheManager.get.mockResolvedValueOnce('999999');

      await expect(
        studentService.verifyCancellationOtp(student.id, '123456'),
      ).rejects.toThrow(new BadRequestException('Invalid or expired OTP.'));
    });

    it('throws BadRequestException if no OTP is in cache', async () => {
      await registerAndValidateStudent();
      const student = await studentRepository.findOne({
        where: { email: studentInfo.email },
      });

      // cache returns null (default mock)
      await expect(
        studentService.verifyCancellationOtp(student.id, '123456'),
      ).rejects.toThrow(new BadRequestException('Invalid or expired OTP.'));
    });
  });

  describe('cancelStudentAccountDeletion', () => {
    it('restores a deactivated student after OTP verification and returns token', async () => {
      await registerAndValidateStudent();
      const student = await studentRepository.findOne({
        where: { email: studentInfo.email },
      });
      await studentRepository.update(student.id, {
        is_deactivated: true,
        deactivated_at: new Date(),
      });

      // Simulate OTP verified in cache
      mockCacheManager.get.mockResolvedValueOnce('1');

      const response = await studentService.cancelStudentAccountDeletion(student.id);

      expect(response.token).toBeDefined();
      expect(response.refresh_token).toBeDefined();
      expect(response.account_status).toBe(AccountStatus.ACTIVE);
      expect(mockAccountDeletionService.restoreStudent).toHaveBeenCalledWith(
        expect.objectContaining({ id: student.id }),
        null,
      );
    });

    it('throws UnauthorizedException when OTP was not verified', async () => {
      await registerAndValidateStudent();
      const student = await studentRepository.findOne({
        where: { email: studentInfo.email },
      });

      // cache returns null (no verified flag)
      await expect(
        studentService.cancelStudentAccountDeletion(student.id),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if student is not deactivated', async () => {
      await registerAndValidateStudent();
      const student = await studentRepository.findOne({
        where: { email: studentInfo.email },
      });

      // OTP is verified but student is not deactivated
      mockCacheManager.get.mockResolvedValueOnce('1');

      await expect(
        studentService.cancelStudentAccountDeletion(student.id),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if student does not exist', async () => {
      mockCacheManager.get.mockResolvedValueOnce('1');

      await expect(
        studentService.cancelStudentAccountDeletion('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(UnauthorizedException);
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
