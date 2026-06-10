import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import {
  Admin,
  Cart,
  Child,
  Course,
  entities,
  Instructor,
  Organization,
  Parent,
  Question,
  Student,
  TestAssignment,
  TestSuite,
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
import { TestAssignmentStatus } from '../entities/test_assignment.entity';
import { TestModeType, TestStatusType } from '../entities/test.entity';
import { TimeEventType } from '../entities/time_event.entity';
import { ClassLevel } from '../../parent/entities/child.entity';
import { Gender } from '../../parent/entities/parent.entity';
import { HashHelper } from '../../../helpers';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { StudentGateway } from '../gateways/student.gateway';
import { InsightService } from './insight.service';
import { MarkAnswerProducer } from './mark-answer.producer';
import { MarkAnswerService } from './mark-answer.service';
import { TestTimerService } from './test-timer.service';
import { StudentService } from './student.service';

describe('StudentService', () => {
  let module: TestingModule;
  let connection: Connection;

  let studentService: StudentService;
  let adminRepository: Repository<Admin>;
  let instructorRepository: Repository<Instructor>;
  let organizationRepository: Repository<Organization>;
  let studentRepository: Repository<Student>;
  let courseRepository: Repository<Course>;
  let versionRepository: Repository<Version>;
  let testSuiteRepository: Repository<TestSuite>;
  let questionRepository: Repository<Question>;
  let testAssignmentRepository: Repository<TestAssignment>;
  let cartRepository: Repository<Cart>;
  let parentRepository: Repository<Parent>;
  let childRepository: Repository<Child>;

  const mockTimerService = {
    startTimer: jest.fn(),
    pauseTimer: jest.fn(),
    resumeTimer: jest.fn(),
    stopTimer: jest.fn(),
  };

  const mockSseGateway = {
    sendTestEnded: jest.fn(),
    sendTimeUpdate: jest.fn(),
    sendTestPaused: jest.fn(),
  };

  const mockMarkAnswerProducer = {
    markShortAnswer: jest.fn().mockResolvedValue(undefined),
  };

  const mockMarkAnswerService = {
    markShortAnswer: jest.fn().mockResolvedValue({}),
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
            secretOrPrivateKey: configService.get('JWT_SECRET') || 'test-secret',
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
        { provide: TestTimerService, useValue: mockTimerService },
        { provide: StudentGateway, useValue: mockSseGateway },
        { provide: MarkAnswerProducer, useValue: mockMarkAnswerProducer },
        { provide: MarkAnswerService, useValue: mockMarkAnswerService },
        {
          provide: InsightService,
          useValue: { invalidateForStudent: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: CACHE_MANAGER,
          useValue: { get: jest.fn().mockResolvedValue(null), set: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    connection = module.get<Connection>(Connection);
    studentService = module.get<StudentService>(StudentService);
    adminRepository = module.get<Repository<Admin>>(getRepositoryToken(Admin));
    instructorRepository = module.get<Repository<Instructor>>(getRepositoryToken(Instructor));
    organizationRepository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    studentRepository = module.get<Repository<Student>>(getRepositoryToken(Student));
    courseRepository = module.get<Repository<Course>>(getRepositoryToken(Course));
    versionRepository = module.get<Repository<Version>>(getRepositoryToken(Version));
    testSuiteRepository = module.get<Repository<TestSuite>>(getRepositoryToken(TestSuite));
    questionRepository = module.get<Repository<Question>>(getRepositoryToken(Question));
    testAssignmentRepository = module.get<Repository<TestAssignment>>(getRepositoryToken(TestAssignment));
    cartRepository = module.get<Repository<Cart>>(getRepositoryToken(Cart));
    parentRepository = module.get<Repository<Parent>>(getRepositoryToken(Parent));
    childRepository = module.get<Repository<Child>>(getRepositoryToken(Child));
  });

  beforeEach(async () => {
    const entityMetadatas = connection.entityMetadatas;
    for (const entity of entityMetadatas) {
      const repository = connection.getRepository(entity.name);
      await repository.query(`TRUNCATE "${entity.tableName}" CASCADE;`);
    }
    jest.clearAllMocks();
  }, 30000);

  afterAll(async () => {
    await connection.close();
    await module.close();
  });

  // ─── helpers ────────────────────────────────────────────────────────────────

  const studentEmail = 'student@test.com';

  const getStudent = async (studentId: string) =>
    studentRepository.findOne({
      where: { id: studentId },
      relations: ['tests.submitted_answers', 'tests.time_events'],
    });

  const setupData = async () => {
    const organization = new Organization();
    organization.name = 'Test Organization';
    organization.email = 'org@test.com';
    organization.password = await HashHelper.encrypt('password');
    await organizationRepository.save(organization);

    const admin = new Admin();
    admin.name = 'Test Admin';
    admin.email = 'admin@test.com';
    admin.password = await HashHelper.encrypt('password');
    admin.organization = organization;
    await adminRepository.save(admin);

    const instructor = new Instructor();
    instructor.name = 'Test Instructor';
    instructor.email = 'instructor@test.com';
    instructor.password = await HashHelper.encrypt('password');
    instructor.organizations = [organization];
    await instructorRepository.save(instructor);

    const course = new Course();
    course.avatar_url = 'https://example.com/avatar.jpg';
    course.currency = CurrencyType.USD;
    course.description = 'Test course';
    course.domains = [DomainType.ENGLISH];
    course.level = LevelType.BEGINNER;
    course.price = 100;
    course.title = 'Test Course';
    course.instructor = instructor;
    course.organization = organization;
    await courseRepository.save(course);

    const version = new Version();
    version.version_number = 1;
    version.course = course;
    await versionRepository.save(version);

    const suite = new TestSuite();
    suite.title = 'Suite Title';
    suite.description = 'Suite Description';
    suite.keywords = ['algebra'];
    suite.course_version = version;
    await testSuiteRepository.save(suite);

    const questions = await Promise.all(
      [
        { num: 1, desc: 'Question 1.', answer: 'option one' },
        { num: 2, desc: 'Question 2.', answer: 'option two' },
      ].map(async ({ num, desc, answer }) => {
        const q = new Question();
        q.question_number = num;
        q.description = desc;
        q.hints = ['hint'];
        q.solution_steps = ['step'];
        q.options = ['option one', 'option two', 'option three'];
        q.type = QuestionType.MULTIPLE_CHOICE;
        q.tags = [QuestionTagType.TAG_ALGEBRA];
        q.difficulty = QuestionDifficultyType.EASY;
        q.estimated_time_in_ms = 10000;
        q.correct_answer = answer;
        q.version = version;
        q.test_suite = suite;
        return q;
      }),
    );
    await questionRepository.save(questions);

    course.approved_version = version;
    await courseRepository.save(course);

    const cart = new Cart();
    await cartRepository.save(cart);

    const student = new Student();
    student.name = 'Test Student';
    student.email = studentEmail;
    student.password = await HashHelper.encrypt('password');
    student.is_account_validated = true;
    student.organizations = [organization];
    student.subscribed_courses = [course];
    student.cart = cart;
    await studentRepository.save(student);

    return { organization, admin, instructor, course, version, suite, questions, student };
  };

  /** Start a test and return both the test and the student */
  const startTest = async (suiteId: string) => {
    const test = await studentService.startTest({ email: studentEmail, suiteId });
    return test;
  };

  // ─── startTest ───────────────────────────────────────────────────────────────

  describe('startTest', () => {
    it('creates an ON_GOING test and stores a STARTED time event', async () => {
      const { suite, student } = await setupData();

      const response = await startTest(suite.id);

      expect(response.status).toBe(TestStatusType.ON_GOING);
      expect(mockTimerService.startTimer).toHaveBeenCalled();

      const std = await getStudent(student.id);
      expect(std.tests[0].id).toBe(response.id);
      expect(std.tests[0].time_events.map((e) => e.type)).toContain(
        TimeEventType.STARTED,
      );
    });

    it('throws ConflictException if student already has an ongoing test', async () => {
      const { suite } = await setupData();
      await startTest(suite.id);

      await expect(startTest(suite.id)).rejects.toThrow(
        new ConflictException('You already have an ongoing test'),
      );
    });

    it('throws NotFoundException if student does not have access to the suite', async () => {
      await setupData();

      await expect(
        studentService.startTest({
          email: studentEmail,
          suiteId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── pauseTest ───────────────────────────────────────────────────────────────

  describe('pauseTest', () => {
    it('pauses an ongoing test and adds a PAUSED time event', async () => {
      const { suite, student } = await setupData();
      const test = await startTest(suite.id);

      const response = await studentService.pauseTest({
        email: studentEmail,
        testId: test.id,
      });

      expect(response.status).toBe(TestStatusType.PAUSED);
      expect(mockTimerService.pauseTimer).toHaveBeenCalled();

      const std = await getStudent(student.id);
      expect(std.tests[0].time_events.map((e) => e.type)).toContain(
        TimeEventType.PAUSED,
      );
      expect(std.tests[0].time_events).toHaveLength(2);
    });

    it('throws NotFoundException if student does not own the test', async () => {
      await setupData();

      await expect(
        studentService.pauseTest({
          email: studentEmail,
          testId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── resumeTest ──────────────────────────────────────────────────────────────

  describe('resumeTest', () => {
    it('resumes a paused test and adds a RESUMED time event', async () => {
      const { suite, student } = await setupData();
      const test = await startTest(suite.id);
      await studentService.pauseTest({ email: studentEmail, testId: test.id });

      const response = await studentService.resumeTest({
        email: studentEmail,
        testId: test.id,
      });

      expect(response.status).toBe(TestStatusType.ON_GOING);
      expect(mockTimerService.resumeTimer).toHaveBeenCalled();

      const std = await getStudent(student.id);
      expect(std.tests[0].time_events.map((e) => e.type)).toContain(
        TimeEventType.RESUMED,
      );
      expect(std.tests[0].time_events).toHaveLength(3);
    });
  });

  // ─── endTest ─────────────────────────────────────────────────────────────────

  describe('endTest', () => {
    it('ends a test and adds an ENDED time event', async () => {
      const { suite, student } = await setupData();
      const test = await startTest(suite.id);

      const response = await studentService.endTest({
        email: studentEmail,
        testId: test.id,
      });

      expect(response.status).toBe(TestStatusType.ENDED);
      expect(mockTimerService.stopTimer).toHaveBeenCalled();
      expect(mockSseGateway.sendTestEnded).toHaveBeenCalled();

      const std = await getStudent(student.id);
      expect(std.tests[0].time_events.map((e) => e.type)).toContain(
        TimeEventType.ENDED,
      );
    });

    it('throws NotFoundException if student does not own the test', async () => {
      await setupData();

      await expect(
        studentService.endTest({
          email: studentEmail,
          testId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getQuestion ─────────────────────────────────────────────────────────────

  describe('getQuestion', () => {
    it('returns an unanswered question from the test suite', async () => {
      const { suite } = await setupData();
      const test = await startTest(suite.id);

      const response = await studentService.getQuestion({
        email: studentEmail,
        testId: test.id,
      });

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
    });

    it('throws BadRequestException when all questions have been answered', async () => {
      const { suite, questions } = await setupData();
      const test = await startTest(suite.id);

      for (const q of questions) {
        await studentService.submitAnswer({
          email: studentEmail,
          testId: test.id,
          questionId: q.id,
          timeRange: `${Date.now()}#${Date.now() + 1000}`,
          answer: q.correct_answer,
          isFlagged: false,
        });
      }

      await expect(
        studentService.getQuestion({ email: studentEmail, testId: test.id }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── submitAnswer ────────────────────────────────────────────────────────────

  describe('submitAnswer', () => {
    it('creates a submitted answer and marks it correctly', async () => {
      const { suite, student, questions } = await setupData();
      const test = await startTest(suite.id);

      const response = await studentService.submitAnswer({
        email: studentEmail,
        testId: test.id,
        questionId: questions[0].id,
        timeRange: `${Date.now()}#${Date.now() + 1000}`,
        answer: questions[0].correct_answer,
        isFlagged: false,
      });

      expect(response.question_id).toBe(questions[0].id);
      expect(response.is_correct).toBe(true);

      const std = await getStudent(student.id);
      expect(std.tests[0].submitted_answers).toHaveLength(1);
    });

    it('marks answer incorrect when answer does not match correct answer', async () => {
      const { suite, questions } = await setupData();
      const test = await startTest(suite.id);

      const response = await studentService.submitAnswer({
        email: studentEmail,
        testId: test.id,
        questionId: questions[0].id,
        timeRange: `${Date.now()}#${Date.now() + 1000}`,
        answer: 'wrong answer',
        isFlagged: false,
      });

      expect(response.is_correct).toBe(false);
    });

    it('updates an existing answer on re-submission', async () => {
      const { suite, questions } = await setupData();
      const test = await startTest(suite.id);

      await studentService.submitAnswer({
        email: studentEmail,
        testId: test.id,
        questionId: questions[0].id,
        timeRange: `${Date.now()}#${Date.now() + 1000}`,
        answer: 'wrong answer',
        isFlagged: false,
      });

      const updated = await studentService.submitAnswer({
        email: studentEmail,
        testId: test.id,
        questionId: questions[0].id,
        timeRange: `${Date.now()}#${Date.now() + 1000}`,
        answer: questions[0].correct_answer,
        isFlagged: false,
      });

      expect(updated.is_correct).toBe(true);
    });

    it('throws BadRequestException when test is ended', async () => {
      const { suite, questions } = await setupData();
      const test = await startTest(suite.id);
      await studentService.endTest({ email: studentEmail, testId: test.id });

      await expect(
        studentService.submitAnswer({
          email: studentEmail,
          testId: test.id,
          questionId: questions[0].id,
          timeRange: `${Date.now()}#${Date.now() + 1000}`,
          answer: 'option one',
          isFlagged: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getAllAttemptedQuestions ─────────────────────────────────────────────────

  describe('getAllAttemptedQuestions', () => {
    it('returns all submitted answers for an ongoing test', async () => {
      const { suite, questions } = await setupData();
      const test = await startTest(suite.id);

      await studentService.submitAnswer({
        email: studentEmail,
        testId: test.id,
        questionId: questions[0].id,
        timeRange: `${Date.now()}#${Date.now() + 1000}`,
        answer: questions[0].correct_answer,
        isFlagged: false,
      });

      const result = await studentService.getAllAttemptedQuestions({
        email: studentEmail,
        testId: test.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0].question_id).toBe(questions[0].id);
    });

    it('throws BadRequestException when test has ended', async () => {
      const { suite } = await setupData();
      const test = await startTest(suite.id);
      await studentService.endTest({ email: studentEmail, testId: test.id });

      await expect(
        studentService.getAllAttemptedQuestions({
          email: studentEmail,
          testId: test.id,
        }),
      ).rejects.toThrow(new BadRequestException('Test has ended'));
    });
  });

  // ─── testStats ───────────────────────────────────────────────────────────────

  describe('testStats', () => {
    it('returns the ended test with all relations', async () => {
      const { suite } = await setupData();
      const test = await startTest(suite.id);
      await studentService.endTest({ email: studentEmail, testId: test.id });

      const result = await studentService.testStats({
        email: studentEmail,
        testId: test.id,
      });

      expect(result.id).toBe(test.id);
      expect(result.status).toBe(TestStatusType.ENDED);
    });

    it('throws BadRequestException when test is not ended', async () => {
      const { suite } = await setupData();
      const test = await startTest(suite.id);

      await expect(
        studentService.testStats({ email: studentEmail, testId: test.id }),
      ).rejects.toThrow(new BadRequestException('Test is not ended'));
    });
  });

  // ─── listMyAssignments ───────────────────────────────────────────────────────

  describe('listMyAssignments', () => {
    it('returns empty array for a student without a child profile', async () => {
      await setupData();

      const result = await studentService.listMyAssignments({
        email: studentEmail,
      });

      expect(result).toHaveLength(0);
    });

    it('returns assignments when child profile exists', async () => {
      const { suite, student } = await setupData();

      const parent = new Parent();
      parent.first_name = 'Test';
      parent.last_name = 'Parent';
      parent.email = 'parent@test.com';
      parent.password = await HashHelper.encrypt('password');
      parent.whatsapp_number = '+1234567890';
      parent.gender = Gender.Male;
      parent.is_account_validated = true;
      parent.is_setup_completed = true;
      await parentRepository.save(parent);

      const child = new Child();
      child.full_name = 'Test Child';
      child.class_level = ClassLevel.JHS1;
      child.target_exam = suite.id;
      child.username = 'test.child99';
      child.pin = await HashHelper.encrypt('123456');
      child.parent = parent;
      child.student = student;
      await childRepository.save(child);

      const assignment = new TestAssignment();
      assignment.parent = parent;
      assignment.child = child;
      assignment.test_suite = suite;
      assignment.status = TestAssignmentStatus.PENDING;
      await testAssignmentRepository.save(assignment);

      const result = await studentService.listMyAssignments({
        email: studentEmail,
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(TestAssignmentStatus.PENDING);
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.listMyAssignments({ email: 'nobody@test.com' }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  // ─── startAssignedTest ───────────────────────────────────────────────────────

  describe('startAssignedTest', () => {
    it('starts a test from an assignment and links them', async () => {
      const { suite, student } = await setupData();

      const parent = new Parent();
      parent.first_name = 'Test';
      parent.last_name = 'Parent';
      parent.email = 'parent@test.com';
      parent.password = await HashHelper.encrypt('password');
      parent.whatsapp_number = '+1234567890';
      parent.gender = Gender.Male;
      parent.is_account_validated = true;
      parent.is_setup_completed = true;
      await parentRepository.save(parent);

      const child = new Child();
      child.full_name = 'Test Child';
      child.class_level = ClassLevel.JHS1;
      child.target_exam = suite.id;
      child.username = 'test.child99';
      child.pin = await HashHelper.encrypt('123456');
      child.parent = parent;
      child.student = student;
      await childRepository.save(child);

      const assignment = new TestAssignment();
      assignment.parent = parent;
      assignment.child = child;
      assignment.test_suite = suite;
      assignment.status = TestAssignmentStatus.PENDING;
      await testAssignmentRepository.save(assignment);

      const result = await studentService.startAssignedTest({
        email: studentEmail,
        assignmentId: assignment.id,
      });

      expect(result.status).toBe(TestStatusType.ON_GOING);
      expect(mockTimerService.startTimer).toHaveBeenCalled();

      const updatedAssignment = await testAssignmentRepository.findOne({
        where: { id: assignment.id },
        relations: ['test'],
      });
      expect(updatedAssignment.test.id).toBe(result.id);
    });

    it('throws NotFoundException if assignment does not exist', async () => {
      const { student, suite } = await setupData();

      const parent = new Parent();
      parent.first_name = 'Test';
      parent.last_name = 'Parent';
      parent.email = 'parent@test.com';
      parent.password = await HashHelper.encrypt('password');
      parent.whatsapp_number = '+1234567890';
      parent.gender = Gender.Male;
      parent.is_account_validated = true;
      parent.is_setup_completed = true;
      await parentRepository.save(parent);

      const child = new Child();
      child.full_name = 'Test Child';
      child.class_level = ClassLevel.JHS1;
      child.target_exam = suite.id;
      child.username = 'test.child99';
      child.pin = await HashHelper.encrypt('123456');
      child.parent = parent;
      child.student = student;
      await childRepository.save(child);

      await expect(
        studentService.startAssignedTest({
          email: studentEmail,
          assignmentId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if student has no child profile', async () => {
      await setupData();

      await expect(
        studentService.startAssignedTest({
          email: studentEmail,
          assignmentId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(new NotFoundException('Child profile not found'));
    });
  });
});
