import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
import { HashHelper } from '../../../helpers';
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
  };

  const mockSignupProducer = {
    enqueueFreeTrial: jest.fn().mockResolvedValue(undefined),
  };

  const mockAccountDeletionService = {
    restoreParent: jest.fn().mockResolvedValue(undefined),
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
        { provide: EmailProducer, useValue: mockEmailProducer },
        { provide: SignupProducer, useValue: mockSignupProducer },
        { provide: AccountDeletionService, useValue: mockAccountDeletionService },
      ],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    parentService = module.get<ParentService>(ParentService);
    parentRepository = module.get<Repository<Parent>>(getRepositoryToken(Parent));
    childRepository = module.get<Repository<Child>>(getRepositoryToken(Child));
    organizationRepository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    categoryRepository = module.get<Repository<Category>>(getRepositoryToken(Category));
    courseRepository = module.get<Repository<Course>>(getRepositoryToken(Course));
    versionRepository = module.get<Repository<Version>>(getRepositoryToken(Version));
    questionRepository = module.get<Repository<Question>>(getRepositoryToken(Question));
    cartRepository = module.get<Repository<Cart>>(getRepositoryToken(Cart));
    studentRepository = module.get<Repository<Student>>(getRepositoryToken(Student));
    testRepository = module.get<Repository<TestEntity>>(getRepositoryToken(TestEntity));
    submittedAnswerRepository = module.get<Repository<SubmittedAnswer>>(getRepositoryToken(SubmittedAnswer));
    timeEventRepository = module.get<Repository<TimeEvent>>(getRepositoryToken(TimeEvent));
    testSuiteRepository = module.get<Repository<TestSuite>>(getRepositoryToken(TestSuite));
    testAssignmentRepository = module.get<Repository<TestAssignment>>(getRepositoryToken(TestAssignment));
  });

  beforeEach(async () => {
    const entityMetadatas = dataSource.entityMetadatas;
    for (const entity of entityMetadatas) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE "${entity.tableName}" CASCADE;`);
    }
    jest.clearAllMocks();
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

    // Return a minimal object satisfying the Course instructor FK
    // (Instructor entity is separate; we use a real Instructor row)
    const { Instructor } = await import('../../auth/entities/instructor.entity');
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

    const results = await parentService.setupParentAccount(parent.email, [
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
      expect(mockEmailProducer.sendAccountValidationEmail).toHaveBeenCalledTimes(2);
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

    it('restores account and returns token if deactivated within 90-day grace period', async () => {
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
      expect(mockAccountDeletionService.restoreParent).toHaveBeenCalledWith(
        expect.objectContaining({ email: parentInfo.email }),
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
  });

  describe('requestParentPasswordReset', () => {
    it('returns success message even when parent does not exist', async () => {
      const response = await parentService.requestParentPasswordReset({
        email: 'nobody@test.com',
      });

      expect(response.message).toBe('Password reset link sent to your email');
      expect(mockEmailProducer.sendParentPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('sets reset_token and sends email when parent exists', async () => {
      await registerAndVerifyParent();

      const response = await parentService.requestParentPasswordReset({
        email: parentInfo.email,
      });

      expect(response.message).toBe('Password reset link sent to your email');
      expect(mockEmailProducer.sendParentPasswordResetEmail).toHaveBeenCalledWith(
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

  describe('setupParentAccount', () => {
    it('creates children, sets parent as setup complete, returns credentials', async () => {
      const org = await seedGenpopOrganization();
      const { category } = await seedCategory(org);
      const parent = await registerAndVerifyParent();

      const results = await parentService.setupParentAccount(parent.email, [
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
        where: { email: parent.email },
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
        parentService.setupParentAccount('nobody@test.com', []),
      ).rejects.toThrow(new NotFoundException('Parent not found'));
    });

    it('throws UnauthorizedException if parent account is not verified', async () => {
      await parentService.registerParent(parentInfo);

      await expect(
        parentService.setupParentAccount(parentInfo.email, []),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Please verify your account before setting up',
        ),
      );
    });

    it('throws NotFoundException if category is not found', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.setupParentAccount(parent.email, [
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

      const result = await parentService.addChild(parent.email, {
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
        parentService.addChild('nobody@test.com', {
          full_name: 'Bob',
          class_level: ClassLevel.JHS1,
          target_exam: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(new NotFoundException('Parent not found'));
    });

    it('throws UnauthorizedException if parent account is not verified', async () => {
      await parentService.registerParent(parentInfo);

      await expect(
        parentService.addChild(parentInfo.email, {
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

      const result = await parentService.resetChildPin(
        parentInfo.email,
        child.id,
      );

      expect(result.message).toBe('Pin reset successfully');
      expect(result.pin).toBeDefined();

      const updated = await childRepository.findOne({
        where: { id: child.id },
      });
      expect(updated.pin).not.toBe(oldPin);
    });

    it('throws NotFoundException if child does not exist', async () => {
      await registerAndVerifyParent();

      await expect(
        parentService.resetChildPin(
          parentInfo.email,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });

  describe('shareChildLogin', () => {
    it('returns a message containing the child username and a new pin', async () => {
      const { child } = await setupParentWithChild();

      const result = await parentService.shareChildLogin(
        parentInfo.email,
        child.id,
      );

      expect(result.message).toContain(child.username);
      expect(result.message).toContain('Alice Child');
    });

    it('throws NotFoundException if child does not exist', async () => {
      await registerAndVerifyParent();

      await expect(
        parentService.shareChildLogin(
          parentInfo.email,
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

      const empty = await parentService.listOrganizationCategories('NonExistent');
      expect(empty).toHaveLength(0);
    });
  });

  describe('listChildren', () => {
    it('returns paginated children for the parent', async () => {
      const { parent } = await setupParentWithChild();

      const result = await parentService.listChildren(parent.email);

      expect(result.edges).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    it('throws NotFoundException if parent does not exist', async () => {
      await expect(
        parentService.listChildren('nobody@test.com'),
      ).rejects.toThrow(new NotFoundException('Parent not found'));
    });
  });

  describe('verifyChildUsername', () => {
    it('returns a temp_token for a known username', async () => {
      const { child } = await setupParentWithChild();

      const result = await parentService.verifyChildUsername(child.username);

      expect(result.temp_token).toBeDefined();
    });

    it('throws NotFoundException for an unknown username', async () => {
      await expect(
        parentService.verifyChildUsername('unknown.user99'),
      ).rejects.toThrow(new NotFoundException('Username not found'));
    });
  });

  describe('loginChild', () => {
    it('returns child with token and refresh_token after valid pin', async () => {
      const { child, results } = await setupParentWithChild();
      const rawPin = results[0].pin;

      const { temp_token } = await parentService.verifyChildUsername(
        child.username,
      );

      const response = await parentService.loginChild(temp_token, rawPin);

      expect(response.token).toBeDefined();
      expect(response.refresh_token).toBeDefined();
    });

    it('throws UnauthorizedException for an invalid temp_token', async () => {
      await expect(
        parentService.loginChild('bad.token', '123456'),
      ).rejects.toThrow(new UnauthorizedException('Invalid or expired token'));
    });

    it('throws UnauthorizedException for a wrong pin', async () => {
      const { child } = await setupParentWithChild();
      const { temp_token } = await parentService.verifyChildUsername(
        child.username,
      );

      await expect(
        parentService.loginChild(temp_token, '000000'),
      ).rejects.toThrow(new UnauthorizedException('Invalid pin'));
    });
  });

  describe('assignTestToChild', () => {
    it('creates and returns a test assignment', async () => {
      const { parent, child, suite } = await setupParentWithChild();

      const assignment = await parentService.assignTestToChild(
        parent.email,
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
          parent.email,
          '00000000-0000-0000-0000-000000000000',
          suite.id,
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });

    it('throws NotFoundException if test suite does not exist', async () => {
      const { parent, child } = await setupParentWithChild();

      await expect(
        parentService.assignTestToChild(
          parent.email,
          child.id,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Test suite not found'));
    });
  });

  describe('listChildAssignments', () => {
    it('returns assignments for the child', async () => {
      const { parent, child, suite } = await setupParentWithChild();
      await parentService.assignTestToChild(parent.email, child.id, suite.id);

      const result = await parentService.listChildAssignments(
        parent.email,
        child.id,
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(TestAssignmentStatus.PENDING);
    });

    it('returns empty array when no assignments exist', async () => {
      const { parent, child } = await setupParentWithChild();

      const result = await parentService.listChildAssignments(
        parent.email,
        child.id,
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('listChildCourses', () => {
    it('returns the courses subscribed by the child', async () => {
      const { parent, child } = await setupParentWithChild();

      const result = await parentService.listChildCourses(parent.email, child.id);

      expect(result.length).toBeGreaterThan(0);
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.listChildCourses(
          parent.email,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });

  describe('getChildStats', () => {
    it('returns zeroed stats when child has no tests', async () => {
      const { parent, child } = await setupParentWithChild();

      const result = await parentService.getChildStats(parent.email, child.id);

      expect(result.avg_score).toBe(0);
      expect(result.total_questions_done).toBe(0);
      expect(result.current_streak_count).toBe(0);
    });

    it('returns correct stats after completing a test', async () => {
      const { parent, child, suite, question } = await setupParentWithChild();

      await createEndedTest(
        child.student,
        suite,
        question,
        true,
        new Date(),
      );

      const result = await parentService.getChildStats(parent.email, child.id);

      expect(result.avg_score).toBe(100);
      expect(result.total_questions_done).toBe(1);
      expect(result.sessions_this_week).toBe(1);
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.getChildStats(
          parent.email,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });

  describe('getChildSubjectProgress', () => {
    it('returns empty array when child has no tests', async () => {
      const { parent, child } = await setupParentWithChild();

      const result = await parentService.getChildSubjectProgress(
        parent.email,
        child.id,
      );

      expect(result).toHaveLength(0);
    });

    it('returns subject progress after a test', async () => {
      const { parent, child, suite, question } = await setupParentWithChild();
      await createEndedTest(child.student, suite, question, true, new Date());

      const result = await parentService.getChildSubjectProgress(
        parent.email,
        child.id,
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].score).toBe(100);
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.getChildSubjectProgress(
          parent.email,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });

  describe('getChildTestsHistory', () => {
    it('returns empty connection when child has no tests', async () => {
      const { parent, child } = await setupParentWithChild();

      const result = await parentService.getChildTestsHistory(
        parent.email,
        child.id,
      );

      expect(result.edges).toHaveLength(0);
    });

    it('returns enriched test history with score and time', async () => {
      const { parent, child, suite, question } = await setupParentWithChild();
      await createEndedTest(child.student, suite, question, true, new Date());

      const result = await parentService.getChildTestsHistory(
        parent.email,
        child.id,
      );

      expect(result.edges).toHaveLength(1);
      expect((result.edges[0].node as any).score).toBe(100);
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.getChildTestsHistory(
          parent.email,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });

  describe('getChildWeakAreas', () => {
    it('returns empty array when child has no tests', async () => {
      const { parent, child } = await setupParentWithChild();

      const result = await parentService.getChildWeakAreas(
        parent.email,
        child.id,
      );

      expect(result).toHaveLength(0);
    });

    it('returns weak areas when accuracy is below 65%', async () => {
      const { parent, child, suite, question } = await setupParentWithChild();
      await createEndedTest(
        child.student,
        suite,
        question,
        false,
        new Date(),
      );

      const result = await parentService.getChildWeakAreas(
        parent.email,
        child.id,
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].accuracy).toBeLessThanOrEqual(65);
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.getChildWeakAreas(
          parent.email,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });

  describe('getChildActivity', () => {
    it('returns empty activity when child has no tests', async () => {
      const { parent, child } = await setupParentWithChild();

      const result = await parentService.getChildActivity(
        parent.email,
        child.id,
      );

      expect(result.edges).toHaveLength(0);
    });

    it('returns activity entries after tests', async () => {
      const { parent, child, suite, question } = await setupParentWithChild();
      await createEndedTest(child.student, suite, question, true, new Date());

      const result = await parentService.getChildActivity(
        parent.email,
        child.id,
      );

      expect(result.edges).toHaveLength(1);
      expect((result.edges[0].node as any).score).toBe(100);
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.getChildActivity(
          parent.email,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });

  describe('getChildStreak', () => {
    it('returns zeroed streak when child has no tests', async () => {
      const { parent, child } = await setupParentWithChild();

      const result = await parentService.getChildStreak(parent.email, child.id);

      expect(result.current_streak).toBe(0);
      expect(result.best_streak).toBe(0);
    });

    it('returns non-zero streak after a test today', async () => {
      const { parent, child, suite, question } = await setupParentWithChild();
      await createEndedTest(child.student, suite, question, true, new Date());

      const result = await parentService.getChildStreak(parent.email, child.id);

      expect(result.current_streak).toBeGreaterThanOrEqual(1);
      expect(result.best_streak).toBeGreaterThanOrEqual(1);
    });

    it('throws NotFoundException if child does not exist', async () => {
      const parent = await registerAndVerifyParent();

      await expect(
        parentService.getChildStreak(
          parent.email,
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
        parent.email,
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
          parent.email,
          '00000000-0000-0000-0000-000000000000',
          1,
          2026,
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });

  describe('listParentAlerts', () => {
    it('returns an empty array when parent has no children', async () => {
      await registerAndVerifyParent();

      const result = await parentService.listParentAlerts(parentInfo.email);

      expect(result).toHaveLength(0);
    });

    it('returns a completion alert when child scored >= 60% recently', async () => {
      const { parent, child, suite, question } = await setupParentWithChild();
      await createEndedTest(child.student, suite, question, true, new Date());

      const result = await parentService.listParentAlerts(parent.email);

      const completionAlert = result.find((a) =>
        a.alert_type === 'info' && a.id.startsWith('completed-'),
      );
      expect(completionAlert).toBeDefined();
    });

    it('throws NotFoundException if parent does not exist', async () => {
      await expect(
        parentService.listParentAlerts('nobody@test.com'),
      ).rejects.toThrow(new NotFoundException('Parent not found'));
    });
  });

  describe('listChildMonthlyReports', () => {
    it('returns empty array when child has no tests', async () => {
      const { parent, child } = await setupParentWithChild();

      const result = await parentService.listChildMonthlyReports(
        parent.email,
        child.id,
      );

      expect(result).toHaveLength(0);
    });

    it('returns monthly report entries after tests', async () => {
      const { parent, child, suite, question } = await setupParentWithChild();
      await createEndedTest(child.student, suite, question, true, new Date());

      const result = await parentService.listChildMonthlyReports(
        parent.email,
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
          parent.email,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });
  });
});
