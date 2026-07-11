import {
  BadRequestException,
  ForbiddenException,
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
  Category,
  Child,
  Course,
  entities,
  Organization,
  Parent,
  Question,
  Student,
  SubmittedAnswer,
  Test as TestEntity,
  TestAssignment,
  TestSuite,
  TimeEvent,
  Version,
} from '../../../database/entities';
import {
  CurrencyType,
  DomainType,
  LevelType,
} from '../../inventory/entities/course.entity';
import {
  QuestionDifficultyType,
  QuestionTagType,
  QuestionType,
} from '../../review/entities/question.entity';
import {
  TestModeType,
  TestStatusType,
} from '../../simulation/entities/test.entity';
import { TimeEventType } from '../../simulation/entities/time_event.entity';
import { TestAssignmentStatus } from '../../simulation/entities/test_assignment.entity';
import { ClassLevel } from '../entities/child.entity';
import { Gender } from '../entities/parent.entity';
import { HashHelper, LoginAttemptService } from '../../../helpers';
import { AccountStatus } from '../../auth/types/account-deletion-response.type';
import { AccountDeletionService } from '../../auth/services/account-deletion.service';
import { EmailProducer } from '../../auth/services/email.producer';
import { SignupProducer } from '../../auth/services/signup.producer';
import { ParentService } from './parent.service';

const GENPOP_EMAIL = 'genpop@codespartans.com';

describe('ParentService', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let parentService: ParentService;

  let parentRepository: Repository<Parent>;
  let childRepository: Repository<Child>;
  let organizationRepository: Repository<Organization>;
  let categoryRepository: Repository<Category>;
  let courseRepository: Repository<Course>;
  let versionRepository: Repository<Version>;
  let questionRepository: Repository<Question>;
  let cartRepository: Repository<Cart>;
  let studentRepository: Repository<Student>;
  let testRepository: Repository<TestEntity>;
  let submittedAnswerRepository: Repository<SubmittedAnswer>;
  let timeEventRepository: Repository<TimeEvent>;
  let testSuiteRepository: Repository<TestSuite>;
  let testAssignmentRepository: Repository<TestAssignment>;

  const mockEmailProducer = {
    sendAccountValidationEmail: jest.fn().mockResolvedValue(undefined),
    sendParentPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    sendAccountRestoredNotice: jest.fn().mockResolvedValue(undefined),
    sendParentAccountAlreadyExistsEmail: jest.fn().mockResolvedValue(undefined),
    sendCancellationOtpEmail: jest.fn().mockResolvedValue(undefined),
    sendChildPinResetRequestEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockSignupProducer = {
    enqueueFreeTrial: jest.fn().mockResolvedValue(undefined),
  };

  const mockAccountDeletionService = {
    restoreParent: jest.fn().mockResolvedValue(undefined),
    restoreChild: jest.fn().mockResolvedValue(undefined),
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
        ParentService,
        LoginAttemptService,
        { provide: EmailProducer, useValue: mockEmailProducer },
        { provide: SignupProducer, useValue: mockSignupProducer },
        {
          provide: AccountDeletionService,
          useValue: mockAccountDeletionService,
        },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    parentService = module.get<ParentService>(ParentService);
    parentRepository = module.get<Repository<Parent>>(
      getRepositoryToken(Parent),
    );
    childRepository = module.get<Repository<Child>>(getRepositoryToken(Child));
    organizationRepository = module.get<Repository<Organization>>(
      getRepositoryToken(Organization),
    );
    categoryRepository = module.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    courseRepository = module.get<Repository<Course>>(
      getRepositoryToken(Course),
    );
    versionRepository = module.get<Repository<Version>>(
      getRepositoryToken(Version),
    );
    questionRepository = module.get<Repository<Question>>(
      getRepositoryToken(Question),
    );
    cartRepository = module.get<Repository<Cart>>(getRepositoryToken(Cart));
    studentRepository = module.get<Repository<Student>>(
      getRepositoryToken(Student),
    );
    testRepository = module.get<Repository<TestEntity>>(
      getRepositoryToken(TestEntity),
    );
    submittedAnswerRepository = module.get<Repository<SubmittedAnswer>>(
      getRepositoryToken(SubmittedAnswer),
    );
    timeEventRepository = module.get<Repository<TimeEvent>>(
      getRepositoryToken(TimeEvent),
    );
    testSuiteRepository = module.get<Repository<TestSuite>>(
      getRepositoryToken(TestSuite),
    );
    testAssignmentRepository = module.get<Repository<TestAssignment>>(
      getRepositoryToken(TestAssignment),
    );
  });

  beforeEach(async () => {
    const entityMetadatas = dataSource.entityMetadatas;
    for (const entity of entityMetadatas) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE "${entity.tableName}" CASCADE;`);
    }
    jest.clearAllMocks();
    mockCacheManager.get.mockResolvedValue(null);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  // ─── helpers ────────────────────────────────────────────────────────────────

  const parentInfo = {
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'parent@test.com',
    whatsapp_number: '+233501234567',
    password: 'password',
    gender: Gender.Female,
  };

  const seedGenpopOrganization = async () => {
    const org = new Organization();
    org.name = 'General Population';
    org.email = GENPOP_EMAIL;
    org.password = await HashHelper.encrypt('password');
    return organizationRepository.save(org);
  };

  const seedCategory = async (org: Organization) => {
    const instructor = await seedInstructor(org);

    const course = new Course();
    course.title = 'Test Course';
    course.description = 'Desc';
    course.avatar_url = 'https://example.com/img.jpg';
    course.currency = CurrencyType.USD;
    course.domains = [DomainType.ENGLISH];
    course.level = LevelType.BEGINNER;
    course.price = 0;
    course.organization = org;
    course.instructor = instructor;
    await courseRepository.save(course);

    const version = new Version();
    version.version_number = 1;
    version.course = course;
    await versionRepository.save(version);

    const q = new Question();
    q.question_number = 1;
    q.description = 'Q1';
    q.hints = [];
    q.solution_steps = [];
    q.options = ['a', 'b'];
    q.type = QuestionType.MULTIPLE_CHOICE;
    q.tags = [QuestionTagType.TAG_ALGEBRA];
    q.difficulty = QuestionDifficultyType.EASY;
    q.estimated_time_in_ms = 5000;
    q.correct_answer = 'a';
    q.version = version;
    await questionRepository.save(q);

    course.approved_version = version;
    await courseRepository.save(course);

    const suite = new TestSuite();
    suite.title = 'Suite One';
    suite.description = 'Desc';
    suite.keywords = [];
    suite.course_version = version;
    await testSuiteRepository.save(suite);

    const category = new Category();
    category.name = 'BECE';
    category.avatar_url = 'https://example.com/cat.jpg';
    category.organization = org;
    category.courses = [course];
    await categoryRepository.save(category);

    return { category, course, version, question: q, suite };
  };

  const seedInstructor = async (org: Organization) => {
    const cart = new Cart();
    await cartRepository.save(cart);

    const student = new Student();
    student.name = 'Instructor Student';
    student.email = `instructor-${Date.now()}@test.com`;
    student.password = await HashHelper.encrypt('password');
    student.is_account_validated = true;
    student.cart = cart;
    student.organizations = [org];
    await studentRepository.save(student);

    const { Instructor } = await import(
      '../../auth/entities/instructor.entity'
    );
    const instructor = new Instructor();
    instructor.name = 'Test Instructor';
    instructor.email = `instr-${Date.now()}@test.com`;
    instructor.password = await HashHelper.encrypt('password');
    instructor.organizations = [org];
    const instructorRepo = dataSource.getRepository(Instructor);
    return instructorRepo.save(instructor);
  };

  /** Register a parent and mark account as verified */
  const registerAndVerifyParent = async () => {
    await parentService.registerParent(parentInfo);
    const parent = await parentRepository.findOne({
      where: { email: parentInfo.email },
    });
    parent.is_account_validated = true;
    parent.validation_code = null;
    return parentRepository.save(parent);
  };

  /** Create a verified parent + one child via setupParentAccount */
  const setupParentWithChild = async () => {
    const org = await seedGenpopOrganization();
    const { category, version, question, suite } = await seedCategory(org);
    const parent = await registerAndVerifyParent();

    const results = await parentService.setupParentAccount(parent.id, [
      {
        full_name: 'Alice Child',
        class_level: ClassLevel.JHS1,
        target_exam: category.id,
      },
    ]);

    const child = await childRepository.findOne({
      where: { username: results[0].username },
      relations: ['student'],
    });

    return { parent, child, category, version, question, suite, results };
  };

  /** Create a completed test with one answer and time events for a student */
  const createEndedTest = async (
    student: Student,
    suite: TestSuite,
    question: Question,
    isCorrect: boolean,
    startTime: Date,
  ) => {
    question.test_suite = suite;
    await questionRepository.save(question);

    const test = new TestEntity();
    test.status = TestStatusType.ENDED;
    test.mode = TestModeType.PROCTURED;
    test.test_suite = suite;
    test.student = student;
    await testRepository.save(test);

    const sa = new SubmittedAnswer();
    sa.question_id = question.id;
    sa.answer_provided = isCorrect ? question.correct_answer : 'wrong';
    sa.hints_used = [];
    sa.is_correct = isCorrect;
    sa.is_flagged = false;
    sa.is_marked = false;
    sa.time_ranges = [];
    sa.question = question;
    sa.test = test;
    await submittedAnswerRepository.save(sa);

    const startEvt = new TimeEvent();
    startEvt.type = TimeEventType.STARTED;
    startEvt.recorded_at = startTime;
    startEvt.test = test;

    const endEvt = new TimeEvent();
    endEvt.type = TimeEventType.ENDED;
    endEvt.recorded_at = new Date(startTime.getTime() + 60_000);
    endEvt.test = test;

    await timeEventRepository.save([startEvt, endEvt]);

    return test;
  };

  // ─── tests ──────────────────────────────────────────────────────────────────

  describe('registerParent', () => {
    it('returns success message and persists the parent', async () => {
      const response = await parentService.registerParent(parentInfo);

      expect(response.message).toBe(
        'Registration successful. Please verify your email.',
      );
      const saved = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });
      expect(saved).toBeDefined();
      expect(saved.is_account_validated).toBe(false);
      expect(mockEmailProducer.sendAccountValidationEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: parentInfo.email }),
      );
    });

    it('returns success message and sends already-exists email when email is taken', async () => {
      await parentService.registerParent(parentInfo);

      const response = await parentService.registerParent(parentInfo);

      expect(response.message).toBe(
        'Registration successful. Please verify your email.',
      );
      expect(
        mockEmailProducer.sendParentAccountAlreadyExistsEmail,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ email: parentInfo.email }),
      );
    });
  });

  describe('verifyParentAccount', () => {
    it('verifies the account with the correct code', async () => {
      await parentService.registerParent(parentInfo);
      const parent = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });

      const response = await parentService.verifyParentAccount({
        email: parentInfo.email,
        code: parent.validation_code,
      });

      expect(response.message).toBe('Account verified successfully');
      const updated = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });
      expect(updated.is_account_validated).toBe(true);
      expect(updated.validation_code).toBeNull();
    });

    it('throws BadRequestException for a wrong verification code', async () => {
      await parentService.registerParent(parentInfo);

      await expect(
        parentService.verifyParentAccount({
          email: parentInfo.email,
          code: 'wrong-code',
        }),
      ).rejects.toThrow(new BadRequestException('Invalid verification code'));
    });

    it('throws BadRequestException if account is already verified', async () => {
      await registerAndVerifyParent();

      await expect(
        parentService.verifyParentAccount({
          email: parentInfo.email,
          code: 'any',
        }),
      ).rejects.toThrow(new BadRequestException('Account is already verified'));
    });

    it('throws NotFoundException if parent does not exist', async () => {
      await expect(
        parentService.verifyParentAccount({
          email: 'nobody@test.com',
          code: '123456',
        }),
      ).rejects.toThrow(new NotFoundException('Parent not found'));
    });

    it('enqueues a free trial job after successful verification', async () => {
      await parentService.registerParent(parentInfo);
      const parent = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });

      await parentService.verifyParentAccount({
        email: parentInfo.email,
        code: parent.validation_code,
      });

      expect(mockSignupProducer.enqueueFreeTrial).toHaveBeenCalledWith({
        email: parentInfo.email,
        role: 'PARENT',
      });
    });
  });

  describe('resendParentAccountValidationCode', () => {
    it('resends the validation code and sends an email', async () => {
      await parentService.registerParent(parentInfo);

      const response = await parentService.resendParentAccountValidationCode(
        parentInfo.email,
      );

      expect(response.message).toBe('Verification email resent successfully');
      expect(
        mockEmailProducer.sendAccountValidationEmail,
      ).toHaveBeenCalledTimes(2);
    });

    it('throws NotFoundException if parent does not exist', async () => {
      await expect(
        parentService.resendParentAccountValidationCode('nobody@test.com'),
      ).rejects.toThrow(new NotFoundException('Parent not found'));
    });

    it('throws BadRequestException if account is already verified', async () => {
      await registerAndVerifyParent();

      await expect(
        parentService.resendParentAccountValidationCode(parentInfo.email),
      ).rejects.toThrow(new BadRequestException('Account is already verified'));
    });
  });

  describe('loginParent', () => {
    it('returns parent with token and refresh_token after successful login', async () => {
      await registerAndVerifyParent();

      const response = await parentService.loginParent({
        email: parentInfo.email,
        password: parentInfo.password,
      });

      expect(response.token).toBeDefined();
      expect(response.refresh_token).toBeDefined();
      expect(response.email).toBe(parentInfo.email);
    });

    it('throws BadRequestException if email is incorrect', async () => {
      await registerAndVerifyParent();

      await expect(
        parentService.loginParent({
          email: 'wrong@test.com',
          password: 'password',
        }),
      ).rejects.toThrow(
        new BadRequestException('Email or password is incorrect'),
      );
    });

    it('throws BadRequestException if password is incorrect', async () => {
      await registerAndVerifyParent();

      await expect(
        parentService.loginParent({
          email: parentInfo.email,
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(
        new BadRequestException('Email or password is incorrect'),
      );
    });

    it('throws BadRequestException if account is not verified', async () => {
      await parentService.registerParent(parentInfo);

      await expect(
        parentService.loginParent({
          email: parentInfo.email,
          password: parentInfo.password,
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'Account not verified. Please check your email for the verification code.',
        ),
      );
    });

    it('throws BadRequestException if account was deactivated more than 90 days ago', async () => {
      await registerAndVerifyParent();
      const ninetyOneDaysAgo = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);
      await parentRepository.update(
        { email: parentInfo.email },
        { is_deactivated: true, deactivated_at: ninetyOneDaysAgo },
      );

      await expect(
        parentService.loginParent({
          email: parentInfo.email,
          password: parentInfo.password,
        }),
      ).rejects.toThrow(
        new BadRequestException('This account no longer exists.'),
      );
    });

    it('returns pending-deletion token and sends OTP when deactivated within grace period', async () => {
      await registerAndVerifyParent();
      await parentRepository.update(
        { email: parentInfo.email },
        {
          is_deactivated: true,
          deactivated_at: new Date(),
          deletion_job_id: 'job-to-cancel',
        },
      );

      const response = await parentService.loginParent({
        email: parentInfo.email,
        password: parentInfo.password,
      });

      expect(response.token).toBeDefined();
      expect(response.account_status).toBe(AccountStatus.PENDING_DELETION);
      expect(response.deletion_scheduled_for).toBeInstanceOf(Date);
      expect(mockEmailProducer.sendCancellationOtpEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: parentInfo.email }),
      );
      expect(mockAccountDeletionService.restoreParent).not.toHaveBeenCalled();
    });

    it('locks account and throws ACCOUNT_LOCKED on the third wrong password', async () => {
      await registerAndVerifyParent();

      mockCacheManager.get.mockImplementation((key: string) => {
        if (key.startsWith('parent_login_attempts:')) return Promise.resolve(2);
        return Promise.resolve(null);
      });

      const error: any = await parentService
        .loginParent({ email: parentInfo.email, password: 'wrongpassword' })
        .catch((e) => e);

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.getResponse()).toMatchObject({
        code: 'ACCOUNT_LOCKED',
        locked_at: expect.any(String),
      });
      expect(error.getResponse().message).toContain('contact support');
      expect(error.getResponse().message).toContain('5 minutes');
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('parent_login_locked:'),
        expect.any(String),
        300_000,
      );
    });

    it('throws ACCOUNT_LOCKED immediately when account is already locked', async () => {
      await registerAndVerifyParent();

      const lockedAt = '2025-01-01T00:00:00.000Z';
      mockCacheManager.get.mockImplementation((key: string) => {
        if (key.startsWith('parent_login_locked:')) return Promise.resolve(lockedAt);
        return Promise.resolve(null);
      });

      const error: any = await parentService
        .loginParent({ email: parentInfo.email, password: parentInfo.password })
        .catch((e) => e);

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.getResponse()).toMatchObject({
        code: 'ACCOUNT_LOCKED',
        locked_at: lockedAt,
      });
    });

    it('does not increment attempts when account is not verified', async () => {
      await parentService.registerParent(parentInfo);

      await expect(
        parentService.loginParent({
          email: parentInfo.email,
          password: parentInfo.password,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockCacheManager.set).not.toHaveBeenCalledWith(
        expect.stringContaining('parent_login_attempts:'),
        expect.anything(),
        expect.anything(),
      );
    });

    it('does not increment attempts when account no longer exists', async () => {
      await registerAndVerifyParent();
      const ninetyOneDaysAgo = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);
      await parentRepository.update(
        { email: parentInfo.email },
        { is_deactivated: true, deactivated_at: ninetyOneDaysAgo },
      );

      await expect(
        parentService.loginParent({
          email: parentInfo.email,
          password: parentInfo.password,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockCacheManager.set).not.toHaveBeenCalledWith(
        expect.stringContaining('parent_login_attempts:'),
        expect.anything(),
        expect.anything(),
      );
    });

    it('clears the attempts counter after a successful login', async () => {
      await registerAndVerifyParent();

      await parentService.loginParent({
        email: parentInfo.email,
        password: parentInfo.password,
      });

      expect(mockCacheManager.del).toHaveBeenCalledWith(
        expect.stringContaining('parent_login_attempts:'),
      );
    });
  });

  describe('refreshParentToken', () => {
    it('returns a new access_token for a valid refresh_token', async () => {
      await registerAndVerifyParent();

      const loginResponse = await parentService.loginParent({
        email: parentInfo.email,
        password: parentInfo.password,
      });

      const result = await parentService.refreshParentToken(
        loginResponse.refresh_token,
      );

      expect(result.access_token).toBeDefined();
    });

    it('throws UnauthorizedException for an invalid token', async () => {
      await expect(
        parentService.refreshParentToken('invalid.token'),
      ).rejects.toThrow(
        new UnauthorizedException('Invalid or expired refresh token'),
      );
    });

    it('throws UnauthorizedException if token type is not refresh', async () => {
      await registerAndVerifyParent();

      const loginResponse = await parentService.loginParent({
        email: parentInfo.email,
        password: parentInfo.password,
      });

      await expect(
        parentService.refreshParentToken(loginResponse.token),
      ).rejects.toThrow(new UnauthorizedException('Invalid token type'));
    });

    it('throws UnauthorizedException when account is deactivated', async () => {
      await registerAndVerifyParent();
      const loginResponse = await parentService.loginParent({
        email: parentInfo.email,
        password: parentInfo.password,
      });

      mockCacheManager.get.mockResolvedValueOnce('1');

      await expect(
        parentService.refreshParentToken(loginResponse.refresh_token),
      ).rejects.toThrow(
        new UnauthorizedException('Account has been deactivated'),
      );
    });

    it('throws UnauthorizedException when password was recently changed', async () => {
      await registerAndVerifyParent();
      const loginResponse = await parentService.loginParent({
        email: parentInfo.email,
        password: parentInfo.password,
      });

      // First cache check (deactivated) returns null, second (pw_changed) returns a future timestamp
      // so that payload.iat < Number(pwChanged) is true and the token is rejected
      mockCacheManager.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(String(Math.floor(Date.now() / 1000) + 3600));

      await expect(
        parentService.refreshParentToken(loginResponse.refresh_token),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Password was recently changed. Please log in again.',
        ),
      );
    });
  });

  describe('requestParentPasswordReset', () => {
    it('returns success message even when parent does not exist', async () => {
      const response = await parentService.requestParentPasswordReset({
        email: 'nobody@test.com',
      });

      expect(response.message).toBe('Password reset link sent to your email');
      expect(
        mockEmailProducer.sendParentPasswordResetEmail,
      ).not.toHaveBeenCalled();
    });

    it('sets reset_token and sends email when parent exists', async () => {
      await registerAndVerifyParent();

      const response = await parentService.requestParentPasswordReset({
        email: parentInfo.email,
      });

      expect(response.message).toBe('Password reset link sent to your email');
      expect(
        mockEmailProducer.sendParentPasswordResetEmail,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ email: parentInfo.email }),
      );

      const parent = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });
      expect(parent.reset_token).toBeTruthy();
    });
  });

  describe('resetParentPassword', () => {
    it('resets the password with a valid token', async () => {
      await registerAndVerifyParent();
      await parentService.requestParentPasswordReset({
        email: parentInfo.email,
      });

      const parent = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });

      const response = await parentService.resetParentPassword({
        email: parentInfo.email,
        password: 'newpassword',
        token: parent.reset_token,
      });

      expect(response.message).toBe('Password reset is successful');

      const updated = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });
      expect(updated.reset_token).toBe('');
      expect(await HashHelper.compare('newpassword', updated.password)).toBe(
        true,
      );
    });

    it('throws BadRequestException for an invalid token', async () => {
      await registerAndVerifyParent();

      await expect(
        parentService.resetParentPassword({
          email: parentInfo.email,
          password: 'newpassword',
          token: 'bad-token',
        }),
      ).rejects.toThrow(
        new BadRequestException('Invalid password reset details'),
      );
    });
  });

  describe('changeParentPassword', () => {
    it('changes the password and sets pw_changed cache flag', async () => {
      const parent = await registerAndVerifyParent();

      const response = await parentService.changeParentPassword({
        id: parent.id,
        currentPassword: parentInfo.password,
        newPassword: 'newSecurePassword',
      });

      expect(response.message).toBe('Password changed successfully');

      const updated = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });
      expect(
        await HashHelper.compare('newSecurePassword', updated.password),
      ).toBe(true);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('pw_changed:'),
        expect.stringMatching(/^\d+$/),
        expect.any(Number),
      );
    });

    it('throws BadRequestException if current password is incorrect', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.changeParentPassword({
          id: parent.id,
          currentPassword: 'wrongpassword',
          newPassword: 'newpass',
        }),
      ).rejects.toThrow(
        new BadRequestException('Current password is incorrect'),
      );
    });

    it('throws BadRequestException if parent does not exist', async () => {
      await expect(
        parentService.changeParentPassword({
          id: '00000000-0000-0000-0000-000000000000',
          currentPassword: 'any',
          newPassword: 'new',
        }),
      ).rejects.toThrow(new BadRequestException('Invalid credentials'));
    });
  });

  describe('verifyCancellationOtp', () => {
    it('returns success when OTP matches the cache', async () => {
      await registerAndVerifyParent();
      const parent = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });

      mockCacheManager.get.mockResolvedValueOnce('654321');

      const result = await parentService.verifyCancellationOtp(
        parent.id,
        '654321',
      );

      expect(result.message).toContain('OTP verified');
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `cancel_otp:${parent.id}`,
      );
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `cancel_otp_verified:${parent.id}`,
        '1',
        expect.any(Number),
      );
    });

    it('throws BadRequestException if OTP does not match', async () => {
      await registerAndVerifyParent();
      const parent = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });

      mockCacheManager.get.mockResolvedValueOnce('111111');

      await expect(
        parentService.verifyCancellationOtp(parent.id, '654321'),
      ).rejects.toThrow(new BadRequestException('Invalid or expired OTP.'));
    });

    it('throws BadRequestException if no OTP is in cache', async () => {
      await registerAndVerifyParent();
      const parent = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });

      // cache returns null (default)
      await expect(
        parentService.verifyCancellationOtp(parent.id, '654321'),
      ).rejects.toThrow(new BadRequestException('Invalid or expired OTP.'));
    });
  });

  describe('cancelParentAccountDeletion', () => {
    it('restores a deactivated parent after OTP verification and returns token', async () => {
      await registerAndVerifyParent();
      const parent = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });
      await parentRepository.update(parent.id, {
        is_deactivated: true,
        deactivated_at: new Date(),
      });

      mockCacheManager.get.mockResolvedValueOnce('1');

      const response = await parentService.cancelParentAccountDeletion(
        parent.id,
      );

      expect(response.token).toBeDefined();
      expect(response.refresh_token).toBeDefined();
      expect(response.account_status).toBe(AccountStatus.ACTIVE);
      expect(mockAccountDeletionService.restoreParent).toHaveBeenCalledWith(
        expect.objectContaining({ id: parent.id }),
        null,
      );
    });

    it('throws UnauthorizedException when OTP was not verified', async () => {
      await registerAndVerifyParent();
      const parent = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });

      await expect(
        parentService.cancelParentAccountDeletion(parent.id),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if parent is not deactivated', async () => {
      await registerAndVerifyParent();
      const parent = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });

      mockCacheManager.get.mockResolvedValueOnce('1');

      await expect(
        parentService.cancelParentAccountDeletion(parent.id),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if parent does not exist', async () => {
      mockCacheManager.get.mockResolvedValueOnce('1');

      await expect(
        parentService.cancelParentAccountDeletion(
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('cancelChildDeletion', () => {
    it('restores a deactivated child student account', async () => {
      const { parent, child } = await setupParentWithChild();

      // Deactivate the child's student
      await studentRepository.update(child.student.id, {
        is_deactivated: true,
        deactivated_at: new Date(),
      });

      const result = await parentService.cancelChildDeletion(
        parent.id,
        child.id,
      );

      expect(result.status).toBe(AccountStatus.ACTIVE);
      expect(result.deletionScheduledFor).toBeNull();
      expect(mockAccountDeletionService.restoreChild).toHaveBeenCalledWith(
        parent.id,
        expect.objectContaining({ id: child.id }),
        null,
      );
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.cancelChildDeletion(
          parent.id,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found.'));
    });

    it('throws ForbiddenException if requesting parent email does not match child', async () => {
      const { child } = await setupParentWithChild();

      await expect(
        parentService.cancelChildDeletion(
          '00000000-0000-0000-0000-000000000000',
          child.id,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException if child student is not deactivated', async () => {
      const { parent, child } = await setupParentWithChild();

      // Child student is active (not deactivated)
      await expect(
        parentService.cancelChildDeletion(parent.id, child.id),
      ).rejects.toThrow(
        new NotFoundException(
          'No pending deletion found for this child account.',
        ),
      );
    });
  });

  describe('setupParentAccount', () => {
    it('creates children, sets parent as setup complete, returns credentials', async () => {
      const org = await seedGenpopOrganization();
      const { category } = await seedCategory(org);
      const parent = await registerAndVerifyParent();

      const results = await parentService.setupParentAccount(parent.id, [
        {
          full_name: 'Alice Child',
          class_level: ClassLevel.JHS1,
          target_exam: category.id,
        },
      ]);

      expect(results).toHaveLength(1);
      expect(results[0].full_name).toBe('Alice Child');
      expect(results[0].username).toBeDefined();
      expect(results[0].pin).toBeDefined();

      const updatedParent = await parentRepository.findOne({
        where: { id: parent.id },
      });
      expect(updatedParent.is_setup_completed).toBe(true);

      const child = await childRepository.findOne({
        where: { username: results[0].username },
        relations: ['student'],
      });
      expect(child).toBeDefined();
      expect(child.student).toBeDefined();
    });

    it('throws NotFoundException if parent does not exist', async () => {
      await expect(
        parentService.setupParentAccount(
          '00000000-0000-0000-0000-000000000000',
          [],
        ),
      ).rejects.toThrow(new NotFoundException('Parent not found'));
    });

    it('throws UnauthorizedException if parent account is not verified', async () => {
      await parentService.registerParent(parentInfo);

      const parent = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });

      await expect(
        parentService.setupParentAccount(parent.id, []),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Please verify your account before setting up',
        ),
      );
    });

    it('throws NotFoundException if category is not found', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.setupParentAccount(parent.id, [
          {
            full_name: 'Alice',
            class_level: ClassLevel.JHS1,
            target_exam: '00000000-0000-0000-0000-000000000000',
          },
        ]),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addChild', () => {
    it('adds a child and returns credentials', async () => {
      const org = await seedGenpopOrganization();
      const { category } = await seedCategory(org);
      const parent = await registerAndVerifyParent();

      const result = await parentService.addChild(parent.id, {
        full_name: 'Bob Child',
        class_level: ClassLevel.SHS1,
        target_exam: category.id,
      });

      expect(result.message).toBe('Child added successfully');
      expect(result.pin).toBeDefined();

      const child = await childRepository.findOne({
        where: { full_name: 'Bob Child' },
      });
      expect(child).toBeDefined();
    });

    it('throws NotFoundException if parent does not exist', async () => {
      await seedGenpopOrganization();

      await expect(
        parentService.addChild('00000000-0000-0000-0000-000000000000', {
          full_name: 'Bob',
          class_level: ClassLevel.JHS1,
          target_exam: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(new NotFoundException('Parent not found'));
    });

    it('throws UnauthorizedException if parent account is not verified', async () => {
      await parentService.registerParent(parentInfo);

      const parent = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });

      await expect(
        parentService.addChild(parent.id, {
          full_name: 'Bob',
          class_level: ClassLevel.JHS1,
          target_exam: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Please verify your account before adding children',
        ),
      );
    });
  });

  describe('resetChildPin', () => {
    it('resets the child pin and returns a new one', async () => {
      const { child } = await setupParentWithChild();
      const oldPin = child.pin;

      const parent = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });

      const result = await parentService.resetChildPin(parent.id, child.id);

      expect(result.message).toBe('Pin reset successfully');
      expect(result.pin).toBeDefined();

      const updated = await childRepository.findOne({
        where: { id: child.id },
      });
      expect(updated.pin).not.toBe(oldPin);
    });

    it('throws NotFoundException if child does not exist', async () => {
      await registerAndVerifyParent();

      const parent = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });

      await expect(
        parentService.resetChildPin(
          parent.id,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });

    it('clears pin attempt counter and lock state from cache after reset', async () => {
      const { child } = await setupParentWithChild();

      const parent = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });

      await parentService.resetChildPin(parent.id, child.id);

      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `child_pin_attempts:${child.id}`,
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        `child_pin_locked:${child.id}`,
      );
    });
  });

  describe('shareChildLogin', () => {
    it('returns a message containing the child username and a new pin', async () => {
      const { child } = await setupParentWithChild();

      const parent = await parentRepository.findOne({
        where: { email: parentInfo.email },
      });

      const result = await parentService.shareChildLogin(parent.id, child.id);

      expect(result.message).toContain(child.username);
      expect(result.message).toContain('Alice Child');
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.shareChildLogin(
          parent.id,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });

  describe('listOrganizationCategories', () => {
    it('returns categories belonging to the GENPOP organization', async () => {
      const org = await seedGenpopOrganization();
      await seedCategory(org);

      const result = await parentService.listOrganizationCategories();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('BECE');
    });

    it('filters categories by searchTerm', async () => {
      const org = await seedGenpopOrganization();
      await seedCategory(org);

      const match = await parentService.listOrganizationCategories('BECE');
      expect(match).toHaveLength(1);

      const empty =
        await parentService.listOrganizationCategories('NonExistent');
      expect(empty).toHaveLength(0);
    });
  });

  describe('listChildren', () => {
    it('returns paginated children for the parent', async () => {
      const { parent } = await setupParentWithChild();

      const result = await parentService.listChildren(parent.id);

      expect(result.edges).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    it('throws NotFoundException if parent does not exist', async () => {
      await expect(
        parentService.listChildren('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(new NotFoundException('Parent not found'));
    });
  });

  describe('loginChild', () => {
    it('returns child with token and refresh_token after valid pin', async () => {
      const { child, results } = await setupParentWithChild();
      const rawPin = results[0].pin;

      const response = await parentService.loginChild(child.username, rawPin);

      expect(response.token).toBeDefined();
      expect(response.refresh_token).toBeDefined();
    });

    it('throws UnauthorizedException for an unknown username', async () => {
      await expect(
        parentService.loginChild('unknown.user99', '123456'),
      ).rejects.toThrow(
        new UnauthorizedException('Username or PIN is incorrect'),
      );
    });

    it('throws UnauthorizedException with INVALID_PIN on the first wrong pin', async () => {
      const { child } = await setupParentWithChild();

      const error: any = await parentService
        .loginChild(child.username, '000000')
        .catch((e) => e);
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.getResponse()).toMatchObject({
        message: 'Incorrect PIN, try again',
        code: 'INVALID_PIN',
        attempts_remaining: 4,
      });
    });

    it('returns decreasing attempts message on subsequent wrong pins', async () => {
      const { child } = await setupParentWithChild();

      // Simulate 1 prior failed attempt already recorded in Redis
      mockCacheManager.get.mockImplementation((key: string) => {
        if (key.startsWith('child_pin_attempts:')) return Promise.resolve(1);
        return Promise.resolve(null);
      });

      const error: any = await parentService
        .loginChild(child.username, '000000')
        .catch((e) => e);
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.getResponse()).toMatchObject({
        message: 'Incorrect PIN, you have 3 more attempts',
        code: 'INVALID_PIN',
        attempts_remaining: 3,
      });
    });

    it('warns of last chance on the fourth wrong pin', async () => {
      const { child } = await setupParentWithChild();

      mockCacheManager.get.mockImplementation((key: string) => {
        if (key.startsWith('child_pin_attempts:')) return Promise.resolve(3);
        return Promise.resolve(null);
      });

      const error: any = await parentService
        .loginChild(child.username, '000000')
        .catch((e) => e);
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.getResponse()).toMatchObject({
        message: expect.stringContaining('1 more attempt'),
        code: 'INVALID_PIN',
        attempts_remaining: 1,
      });
    });

    it('locks account and throws ACCOUNT_LOCKED on the fifth wrong pin', async () => {
      const { child } = await setupParentWithChild();

      mockCacheManager.get.mockImplementation((key: string) => {
        if (key.startsWith('child_pin_attempts:')) return Promise.resolve(4);
        return Promise.resolve(null);
      });

      const error: any = await parentService
        .loginChild(child.username, '000000')
        .catch((e) => e);
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.getResponse()).toMatchObject({
        code: 'ACCOUNT_LOCKED',
        locked_at: expect.any(String),
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('child_pin_locked:'),
        expect.any(String),
        300_000,
      );
    });

    it('throws ACCOUNT_LOCKED immediately when account is already locked', async () => {
      const { child } = await setupParentWithChild();

      const lockedAt = '2025-01-01T00:00:00.000Z';
      mockCacheManager.get.mockImplementation((key: string) => {
        if (key.startsWith('child_pin_locked:')) return Promise.resolve(lockedAt);
        return Promise.resolve(null);
      });

      const error: any = await parentService
        .loginChild(child.username, '000000')
        .catch((e) => e);
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.getResponse()).toMatchObject({
        code: 'ACCOUNT_LOCKED',
        locked_at: lockedAt,
      });
    });

    it('resets expired attempt counter and allows login with correct pin', async () => {
      const { child, results } = await setupParentWithChild();
      const rawPin = results[0].pin;

      // Lock key has expired (null) but attempts key still holds 5 from before
      mockCacheManager.get.mockImplementation((key: string) => {
        if (key.startsWith('child_pin_attempts:')) return Promise.resolve(5);
        return Promise.resolve(null);
      });

      const response = await parentService.loginChild(child.username, rawPin);
      expect(response.token).toBeDefined();
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        expect.stringContaining('child_pin_attempts:'),
      );
    });

    it('throws UnauthorizedException when child student is pending deletion', async () => {
      const { child } = await setupParentWithChild();

      // Deactivate the child's student
      await studentRepository.update(child.student.id, {
        is_deactivated: true,
        deactivated_at: new Date(),
      });

      await expect(
        parentService.loginChild(child.username, '000000'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('requestChildPinReset', () => {
    it('enqueues pin reset email and returns true when account is locked', async () => {
      const { child } = await setupParentWithChild();

      mockCacheManager.get.mockImplementation((key: string) => {
        if (key.startsWith('child_pin_locked:'))
          return Promise.resolve('2025-01-01T00:00:00.000Z');
        return Promise.resolve(null);
      });

      const result = await parentService.requestChildPinReset(child.username);

      expect(result).toBe(true);
      expect(mockEmailProducer.sendChildPinResetRequestEmail).toHaveBeenCalledWith({
        email: parentInfo.email,
        parentName: `${parentInfo.first_name} ${parentInfo.last_name}`,
        childName: 'Alice Child',
      });
    });

    it('throws NotFoundException for an unknown username', async () => {
      await expect(
        parentService.requestChildPinReset('unknown.user99'),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });

    it('throws BadRequestException when account is not locked', async () => {
      const { child } = await setupParentWithChild();

      // Default cache mock returns null — no active lock
      await expect(
        parentService.requestChildPinReset(child.username),
      ).rejects.toThrow(new BadRequestException('Account is not currently locked'));
    });
  });

  describe('assignTestToChild', () => {
    it('creates and returns a test assignment', async () => {
      const { parent, child, suite } = await setupParentWithChild();

      const assignment = await parentService.assignTestToChild(
        parent.id,
        child.id,
        suite.id,
        'Practice hard!',
      );

      expect(assignment.id).toBeDefined();
      expect(assignment.status).toBe(TestAssignmentStatus.PENDING);
      expect(assignment.note).toBe('Practice hard!');
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();
      const org = await seedGenpopOrganization();
      const { suite } = await seedCategory(org);

      await expect(
        parentService.assignTestToChild(
          parent.id,
          '00000000-0000-0000-0000-000000000000',
          suite.id,
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });

    it('throws NotFoundException if test suite does not exist', async () => {
      const { parent, child } = await setupParentWithChild();

      await expect(
        parentService.assignTestToChild(
          parent.id,
          child.id,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Test suite not found'));
    });
  });

  describe('listChildAssignments', () => {
    it('returns assignments for the child', async () => {
      const { parent, child, suite } = await setupParentWithChild();
      await parentService.assignTestToChild(parent.id, child.id, suite.id);

      const result = await parentService.listChildAssignments(
        parent.id,
        child.id,
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(TestAssignmentStatus.PENDING);
    });

    it('returns empty array when no assignments exist', async () => {
      const { parent, child } = await setupParentWithChild();

      const result = await parentService.listChildAssignments(
        parent.id,
        child.id,
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('listChildCourses', () => {
    it('returns the courses subscribed by the child', async () => {
      const { parent, child } = await setupParentWithChild();

      const result = await parentService.listChildCourses(parent.id, child.id);

      expect(result.length).toBeGreaterThan(0);
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.listChildCourses(
          parent.id,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });

  describe('getChildStats', () => {
    it('returns zeroed stats when child has no tests', async () => {
      const { parent, child } = await setupParentWithChild();

      const result = await parentService.getChildStats(parent.id, child.id);

      expect(result.avg_score).toBe(0);
      expect(result.total_questions_done).toBe(0);
      expect(result.current_streak_count).toBe(0);
    });

    it('returns correct stats after completing a test', async () => {
      const { parent, child, suite, question } = await setupParentWithChild();

      await createEndedTest(child.student, suite, question, true, new Date());

      const result = await parentService.getChildStats(parent.id, child.id);

      expect(result.avg_score).toBe(100);
      expect(result.total_questions_done).toBe(1);
      expect(result.sessions_this_week).toBe(1);
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.getChildStats(
          parent.id,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });

  describe('getChildSubjectProgress', () => {
    it('returns empty array when child has no tests', async () => {
      const { parent, child } = await setupParentWithChild();

      const result = await parentService.getChildSubjectProgress(
        parent.id,
        child.id,
      );

      expect(result).toHaveLength(0);
    });

    it('returns subject progress after a test', async () => {
      const { parent, child, suite, question } = await setupParentWithChild();
      await createEndedTest(child.student, suite, question, true, new Date());

      const result = await parentService.getChildSubjectProgress(
        parent.id,
        child.id,
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].score).toBe(100);
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.getChildSubjectProgress(
          parent.id,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });

  describe('getChildTestsHistory', () => {
    it('returns empty connection when child has no tests', async () => {
      const { parent, child } = await setupParentWithChild();

      const result = await parentService.getChildTestsHistory(
        parent.id,
        child.id,
      );

      expect(result.edges).toHaveLength(0);
    });

    it('returns enriched test history with score and time', async () => {
      const { parent, child, suite, question } = await setupParentWithChild();
      await createEndedTest(child.student, suite, question, true, new Date());

      const result = await parentService.getChildTestsHistory(
        parent.id,
        child.id,
      );

      expect(result.edges).toHaveLength(1);
      expect((result.edges[0].node as any).score).toBe(100);
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.getChildTestsHistory(
          parent.id,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });

  describe('getChildWeakAreas', () => {
    it('returns empty array when child has no tests', async () => {
      const { parent, child } = await setupParentWithChild();

      const result = await parentService.getChildWeakAreas(parent.id, child.id);

      expect(result).toHaveLength(0);
    });

    it('returns weak areas when accuracy is below 65%', async () => {
      const { parent, child, suite, question } = await setupParentWithChild();
      await createEndedTest(child.student, suite, question, false, new Date());

      const result = await parentService.getChildWeakAreas(parent.id, child.id);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].accuracy).toBeLessThanOrEqual(65);
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.getChildWeakAreas(
          parent.id,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });

  describe('getChildActivity', () => {
    it('returns empty activity when child has no tests', async () => {
      const { parent, child } = await setupParentWithChild();

      const result = await parentService.getChildActivity(parent.id, child.id);

      expect(result.edges).toHaveLength(0);
    });

    it('returns activity entries after tests', async () => {
      const { parent, child, suite, question } = await setupParentWithChild();
      await createEndedTest(child.student, suite, question, true, new Date());

      const result = await parentService.getChildActivity(parent.id, child.id);

      expect(result.edges).toHaveLength(1);
      expect((result.edges[0].node as any).score).toBe(100);
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.getChildActivity(
          parent.id,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });

  describe('getChildStreak', () => {
    it('returns zeroed streak when child has no tests', async () => {
      const { parent, child } = await setupParentWithChild();

      const result = await parentService.getChildStreak(parent.id, child.id);

      expect(result.current_streak).toBe(0);
      expect(result.best_streak).toBe(0);
    });

    it('returns non-zero streak after a test today', async () => {
      const { parent, child, suite, question } = await setupParentWithChild();
      await createEndedTest(child.student, suite, question, true, new Date());

      const result = await parentService.getChildStreak(parent.id, child.id);

      expect(result.current_streak).toBeGreaterThanOrEqual(1);
      expect(result.best_streak).toBeGreaterThanOrEqual(1);
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.getChildStreak(
          parent.id,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });

  describe('listChildStreak', () => {
    it('returns a full month calendar with is_active flags', async () => {
      const { parent, child, suite, question } = await setupParentWithChild();
      const now = new Date();
      await createEndedTest(child.student, suite, question, true, now);

      const result = await parentService.listChildStreak(
        parent.id,
        child.id,
        now.getMonth() + 1,
        now.getFullYear(),
      );

      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ).getDate();
      expect(result).toHaveLength(daysInMonth);

      const todayStr = now.toISOString().split('T')[0];
      const todayEntry = result.find((r) => r.date === todayStr);
      expect(todayEntry?.is_active).toBe(true);
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.listChildStreak(
          parent.id,
          '00000000-0000-0000-0000-000000000000',
          1,
          2026,
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });

  describe('listParentAlerts', () => {
    it('returns an empty array when parent has no children', async () => {
      const parent = await registerAndVerifyParent();

      const result = await parentService.listParentAlerts(parent.id);

      expect(result).toHaveLength(0);
    });

    it('returns a completion alert when child scored >= 60% recently', async () => {
      const { parent, child, suite, question } = await setupParentWithChild();
      await createEndedTest(child.student, suite, question, true, new Date());

      const result = await parentService.listParentAlerts(parent.id);

      const completionAlert = result.find(
        (a) => a.alert_type === 'info' && a.id.startsWith('completed-'),
      );
      expect(completionAlert).toBeDefined();
    });

    it('throws NotFoundException if parent does not exist', async () => {
      await expect(
        parentService.listParentAlerts('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(new NotFoundException('Parent not found'));
    });
  });

  describe('logoutParent', () => {
    it('returns success message', async () => {
      const response = await parentService.logoutParent({
        userId: '00000000-0000-0000-0000-000000000001',
      });
      expect(response).toEqual({ message: 'Logged out successfully' });
    });

    it('stores a Unix timestamp in cache under the logged_out key', async () => {
      const userId = '00000000-0000-0000-0000-000000000001';
      const before = Math.floor(Date.now() / 1000);

      await parentService.logoutParent({ userId });

      const after = Math.floor(Date.now() / 1000);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `logged_out:${userId}`,
        expect.stringMatching(/^\d+$/),
        expect.any(Number),
      );
      const storedTimestamp = Number(mockCacheManager.set.mock.calls[0][1]);
      expect(storedTimestamp).toBeGreaterThanOrEqual(before);
      expect(storedTimestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('listChildMonthlyReports', () => {
    it('returns empty array when child has no tests', async () => {
      const { parent, child } = await setupParentWithChild();

      const result = await parentService.listChildMonthlyReports(
        parent.id,
        child.id,
      );

      expect(result).toHaveLength(0);
    });

    it('returns monthly report entries after tests', async () => {
      const { parent, child, suite, question } = await setupParentWithChild();
      await createEndedTest(child.student, suite, question, true, new Date());

      const result = await parentService.listChildMonthlyReports(
        parent.id,
        child.id,
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].avg_score).toBe(100);
      expect(result[0].total_questions).toBe(1);
      expect(result[0].streak_days).toBe(1);
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.listChildMonthlyReports(
          parent.id,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });
});
