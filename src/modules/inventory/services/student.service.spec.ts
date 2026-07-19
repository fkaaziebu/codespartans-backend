import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Admin,
  Cart,
  Category,
  Course,
  entities,
  Instructor,
  Organization,
  Question,
  Student,
  SubmittedAnswer,
  Test as TestEntity,
  TestSuite,
  TimeEvent,
  Version,
} from '../../../database/entities';
import {
  CurrencyType,
  DomainType,
  LevelType,
} from '../entities/course.entity';
import {
  QuestionDifficultyType,
  QuestionTagType,
  QuestionType,
} from '../../review/entities/question.entity';
import { SuiteType } from '../../review/entities/test_suite.entity';
import {
  TestModeType,
  TestStatusType,
} from '../../simulation/entities/test.entity';
import { TimeEventType } from '../../simulation/entities/time_event.entity';
import { HashHelper } from '../../../helpers';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';
import { StudentService } from './student.service';

describe('StudentService', () => {
  let module: TestingModule;
  let dataSource: DataSource;

  let studentService: StudentService;
  let adminRepository: Repository<Admin>;
  let instructorRepository: Repository<Instructor>;
  let organizationRepository: Repository<Organization>;
  let studentRepository: Repository<Student>;
  let courseRepository: Repository<Course>;
  let versionRepository: Repository<Version>;
  let questionRepository: Repository<Question>;
  let cartRepository: Repository<Cart>;
  let categoryRepository: Repository<Category>;
  let testRepository: Repository<TestEntity>;
  let submittedAnswerRepository: Repository<SubmittedAnswer>;
  let timeEventRepository: Repository<TimeEvent>;
  let testSuiteRepository: Repository<TestSuite>;

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
        StudentService,
        {
          provide: CACHE_MANAGER,
          useValue: { get: jest.fn().mockResolvedValue(null), set: jest.fn().mockResolvedValue(undefined), del: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: ModuleLoggerRegistry,
          useValue: {
            getLogger: jest.fn().mockReturnValue({
              info: jest.fn(),
              warn: jest.fn(),
              error: jest.fn(),
              debug: jest.fn(),
              trace: jest.fn(),
              fatal: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    studentService = module.get<StudentService>(StudentService);
    instructorRepository = module.get<Repository<Instructor>>(
      getRepositoryToken(Instructor),
    );
    organizationRepository = module.get<Repository<Organization>>(
      getRepositoryToken(Organization),
    );
    adminRepository = module.get<Repository<Admin>>(getRepositoryToken(Admin));
    studentRepository = module.get<Repository<Student>>(
      getRepositoryToken(Student),
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
    categoryRepository = module.get<Repository<Category>>(
      getRepositoryToken(Category),
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

  // ─── helpers ───────────────────────────────────────────────────────────────

  const getStudent = async (email: string) =>
    studentRepository.findOne({
      where: { email },
      relations: [
        'cart.courses',
        'cart.categories.courses',
        'subscribed_courses',
        'subscribed_categories',
        'checkouts.courses',
      ],
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

    const cart = new Cart();
    await cartRepository.save(cart);

    const student = new Student();
    student.name = 'Test Student';
    student.email = 'student@test.com';
    student.password = await HashHelper.encrypt('password');
    student.is_account_validated = true;
    student.cart = cart;
    student.organizations = [organization];
    await studentRepository.save(student);

    const makeCourse = async (title: string) => {
      const course = new Course();
      course.avatar_url = 'https://example.com/avatar.jpg';
      course.currency = CurrencyType.USD;
      course.description = 'Test course';
      course.domains = [DomainType.ENGLISH];
      course.level = LevelType.BEGINNER;
      course.price = 100;
      course.title = title;
      course.instructor = instructor;
      course.organization = organization;
      await courseRepository.save(course);

      const version = new Version();
      version.version_number = 1;
      version.course = course;
      version.assigned_admin = admin;
      await versionRepository.save(version);

      const q = new Question();
      q.question_number = 1;
      q.description = `${title} question`;
      q.hints = [];
      q.solution_steps = [];
      q.options = ['a', 'b', 'c'];
      q.type = QuestionType.MULTIPLE_CHOICE;
      q.tags = [QuestionTagType.TAG_ALGEBRA];
      q.difficulty = QuestionDifficultyType.EASY;
      q.estimated_time_in_ms = 10000;
      q.correct_answer = 'a';
      q.version = version;
      await questionRepository.save(q);

      course.approved_version = version;
      await courseRepository.save(course);

      return { course, version, question: q };
    };

    const { course, version, question } = await makeCourse('Test Course');
    const { course: course2, version: version2, question: question2 } =
      await makeCourse('Test Course 2');

    const category = new Category();
    category.avatar_url = 'https://example.com/cat.jpg';
    category.name = 'Test Category';
    category.organization = organization;
    category.courses = [course, course2];
    await categoryRepository.save(category);

    return {
      organization,
      admin,
      instructor,
      student,
      cart,
      course,
      course2,
      version,
      version2,
      question,
      question2,
      category,
    };
  };

  /** Create a completed test with submitted answers and time events */
  const createEndedTest = async (
    student: Student,
    testSuite: TestSuite,
    questions: Question[],
    correctAnswers: boolean[],
    startTime: Date,
  ) => {
    // Link questions to the test suite so score calculation works
    for (const q of questions) {
      q.test_suite = testSuite;
      await questionRepository.save(q);
    }

    const test = new TestEntity();
    test.status = TestStatusType.ENDED;
    test.mode = TestModeType.PROCTURED;
    test.test_suite = testSuite;
    test.student = student;
    await testRepository.save(test);

    const answers = await Promise.all(
      questions.map(async (q, i) => {
        const sa = new SubmittedAnswer();
        sa.question_id = q.id;
        sa.answer_provided = correctAnswers[i] ? q.correct_answer : 'wrong';
        sa.hints_used = [];
        sa.is_correct = correctAnswers[i];
        sa.is_flagged = false;
        sa.is_marked = false;
        sa.time_ranges = [];
        sa.question = q;
        sa.test = test;
        return sa;
      }),
    );
    await submittedAnswerRepository.save(answers);

    const endTime = new Date(startTime.getTime() + 60000);
    const startEvent = new TimeEvent();
    startEvent.type = TimeEventType.STARTED;
    startEvent.recorded_at = startTime;
    startEvent.test = test;

    const endEvent = new TimeEvent();
    endEvent.type = TimeEventType.ENDED;
    endEvent.recorded_at = endTime;
    endEvent.test = test;

    await timeEventRepository.save([startEvent, endEvent]);

    return test;
  };

  // ─── tests ─────────────────────────────────────────────────────────────────

  describe('listOrganizationCourses', () => {
    it('returns only courses with approved versions', async () => {
      const { student, course, course2 } = await setupData();
      student.subscribed_courses = [course, course2];
      await studentRepository.save(student);

      const result = await studentService.listOrganizationCourses({
        id: student.id,
      });

      expect(result).toHaveLength(2);
      expect(result.every((c) => c.approved_version !== undefined)).toBe(true);
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.listOrganizationCourses({ id: '00000000-0000-0000-0000-000000000000' }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });

    it('filters test suites by the category the student is subscribed to', async () => {
      const { student, course, category } = await setupData();
      student.subscribed_courses = [course];
      student.subscribed_categories = [category];
      await studentRepository.save(student);

      const otherCategory = new Category();
      otherCategory.avatar_url = 'https://example.com/cat2.jpg';
      otherCategory.name = 'Other Category';
      otherCategory.organization = category.organization;
      await categoryRepository.save(otherCategory);

      const matchingSuite = new TestSuite();
      matchingSuite.title = 'Matching Suite';
      matchingSuite.description = 'Desc';
      matchingSuite.keywords = [];
      matchingSuite.categoryId = category.id;
      matchingSuite.course_version = course.approved_version;
      await testSuiteRepository.save(matchingSuite);

      const otherSuite = new TestSuite();
      otherSuite.title = 'Other Suite';
      otherSuite.description = 'Desc';
      otherSuite.keywords = [];
      otherSuite.categoryId = otherCategory.id;
      otherSuite.course_version = course.approved_version;
      await testSuiteRepository.save(otherSuite);

      const result = await studentService.listOrganizationCourses({
        id: student.id,
      });

      const suiteTitles = result[0].approved_version.test_suites.map(
        (s) => s.title,
      );
      expect(suiteTitles).toEqual(['Matching Suite']);
    });
  });

  describe('listOrganizationCoursesPaginated', () => {
    it('returns paginated courses', async () => {
      const { student, course, course2 } = await setupData();
      student.subscribed_courses = [course, course2];
      await studentRepository.save(student);

      const result = await studentService.listOrganizationCoursesPaginated({
        id: student.id,
      });

      expect(result.edges).toHaveLength(2);
      expect(result.count).toBe(2);
    });
  });

  describe('listCartCourses', () => {
    it('returns an empty list when cart is empty', async () => {
      const { student } = await setupData();

      const result = await studentService.listCartCourses({
        id: student.id,
      });

      expect(result).toHaveLength(0);
    });

    it('returns courses that are in the cart', async () => {
      const { student, course } = await setupData();
      await studentService.addCourseToCart({
        id: student.id,
        courseId: course.id,
      });

      const result = await studentService.listCartCourses({
        id: student.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(course.id);
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.listCartCourses({ id: '00000000-0000-0000-0000-000000000000' }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  describe('listCartCategories', () => {
    it('returns an empty list when cart has no categories', async () => {
      const { student } = await setupData();

      const result = await studentService.listCartCategories({
        id: student.id,
      });

      expect(result).toHaveLength(0);
    });

    it('returns categories that are in the cart', async () => {
      const { student, category } = await setupData();
      await studentService.addCategoryToCart({
        id: student.id,
        categoryId: category.id,
      });

      const result = await studentService.listCartCategories({
        id: student.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(category.id);
    });
  });

  describe('listOrganizationCategories', () => {
    it('returns categories belonging to the student organization', async () => {
      const { student } = await setupData();

      const result = await studentService.listOrganizationCategories({
        id: student.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Category');
    });

    it('filters categories by searchTerm', async () => {
      const { student } = await setupData();

      const match = await studentService.listOrganizationCategories({
        id: student.id,
        searchTerm: 'Test',
      });
      expect(match).toHaveLength(1);

      const empty = await studentService.listOrganizationCategories({
        id: student.id,
        searchTerm: 'NonExistent',
      });
      expect(empty).toHaveLength(0);
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.listOrganizationCategories({ id: '00000000-0000-0000-0000-000000000000' }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  describe('addCourseToCart', () => {
    it('adds the course to the cart and returns the updated cart', async () => {
      const { student, course, cart } = await setupData();

      const response = await studentService.addCourseToCart({
        id: student.id,
        courseId: course.id,
      });

      expect(response.id).toBe(cart.id);
      expect(response.courses[0].id).toBe(course.id);

      const updated = await getStudent(student.email);
      expect(updated.cart.courses).toHaveLength(1);
    });

    it('throws an error if student does not exist', async () => {
      const { course } = await setupData();

      await expect(
        studentService.addCourseToCart({
          id: '00000000-0000-0000-0000-000000000000',
          courseId: course.id,
        }),
      ).rejects.toThrow('Student not found');
    });
  });

  describe('removeCourseFromCart', () => {
    it('removes the course from the cart', async () => {
      const { student, course } = await setupData();
      await studentService.addCourseToCart({
        id: student.id,
        courseId: course.id,
      });

      const response = await studentService.removeCourseFromCart({
        id: student.id,
        courseId: course.id,
      });

      expect(response.courses).toHaveLength(0);

      const updated = await getStudent(student.email);
      expect(updated.cart.courses).toHaveLength(0);
    });
  });

  describe('addCategoryToCart', () => {
    it('adds the category to the cart and returns it with courses', async () => {
      const { student, category, cart } = await setupData();

      const response = await studentService.addCategoryToCart({
        id: student.id,
        categoryId: category.id,
      });

      expect(response.id).toBe(cart.id);
      expect(response.categories[0].courses).toHaveLength(2);

      const updated = await getStudent(student.email);
      expect(updated.cart.categories[0].id).toBe(category.id);
    });
  });

  describe('createCheckout', () => {
    it('checks out from cart with an additional courseId', async () => {
      const { student, course, course2 } = await setupData();
      await studentService.addCourseToCart({
        id: student.id,
        courseId: course2.id,
      });

      const response = await studentService.createCheckout({
        id: student.id,
        checkoutFromCart: true,
        courseId: course.id,
        autoApproveSubscription: true,
      });

      expect(response.courses).toHaveLength(2);

      const updated = await getStudent(student.email);
      expect(updated.subscribed_courses).toHaveLength(2);
      expect(updated.cart.courses).toHaveLength(0);
    });

    it('does not subscribe when autoApproveSubscription is false', async () => {
      const { student, course, course2 } = await setupData();
      await studentService.addCourseToCart({
        id: student.id,
        courseId: course2.id,
      });

      await studentService.createCheckout({
        id: student.id,
        checkoutFromCart: true,
        courseId: course.id,
        autoApproveSubscription: false,
      });

      const updated = await getStudent(student.email);
      expect(updated.subscribed_courses).toHaveLength(0);
      expect(updated.cart.courses).toHaveLength(0);
    });

    it('checks out all cart courses when only checkoutFromCart is true', async () => {
      const { student, course, course2 } = await setupData();
      await studentService.addCourseToCart({
        id: student.id,
        courseId: course.id,
      });
      await studentService.addCourseToCart({
        id: student.id,
        courseId: course2.id,
      });

      await studentService.createCheckout({
        id: student.id,
        checkoutFromCart: true,
        autoApproveSubscription: true,
      });

      const updated = await getStudent(student.email);
      expect(updated.subscribed_courses).toHaveLength(2);
      expect(updated.cart.courses).toHaveLength(0);
    });

    it('checks out a single course when only courseId is provided', async () => {
      const { student, course, course2 } = await setupData();
      await studentService.addCourseToCart({
        id: student.id,
        courseId: course.id,
      });
      await studentService.addCourseToCart({
        id: student.id,
        courseId: course2.id,
      });

      await studentService.createCheckout({
        id: student.id,
        courseId: course.id,
        autoApproveSubscription: true,
      });

      const updated = await getStudent(student.email);
      expect(updated.subscribed_courses).toHaveLength(1);
      expect(updated.cart.courses).toHaveLength(1);
    });

    it('checks out cart with categories and courses', async () => {
      const { student, course2, category } = await setupData();
      await studentService.addCourseToCart({
        id: student.id,
        courseId: course2.id,
      });
      await studentService.addCategoryToCart({
        id: student.id,
        categoryId: category.id,
      });

      await studentService.createCheckout({
        id: student.id,
        checkoutFromCart: true,
        autoApproveSubscription: true,
      });

      const updated = await getStudent(student.email);
      expect(updated.subscribed_courses).toHaveLength(2);
      expect(updated.subscribed_categories).toHaveLength(1);
      expect(updated.cart.courses).toHaveLength(0);
      expect(updated.cart.categories).toHaveLength(0);
    });
  });

  describe('completeSetup', () => {
    it('marks setup as complete and subscribes to category and selected courses', async () => {
      const { student, category, course } = await setupData();

      const response = await studentService.completeSetup({
        id: student.id,
        categoryId: category.id,
        courseIds: [course.id],
      });

      expect(response.is_setup_completed).toBe(true);

      const updated = await getStudent(student.email);
      expect(updated.subscribed_categories).toHaveLength(1);
      expect(updated.subscribed_courses).toHaveLength(1);
    });

    it('throws BadRequestException if student is already subscribed to the category', async () => {
      const { student, category } = await setupData();
      await studentService.completeSetup({
        id: student.id,
        categoryId: category.id,
        courseIds: [],
      });

      await expect(
        studentService.completeSetup({
          id: student.id,
          categoryId: category.id,
          courseIds: [],
        }),
      ).rejects.toThrow(
        new BadRequestException('You have already subscribed to this category'),
      );
    });
  });

  describe('getOrganizationCourse', () => {
    it('returns the course with is_subscribed and is_course_in_cart flags', async () => {
      const { student, course } = await setupData();

      const result = await studentService.getOrganizationCourse({
        id: student.id,
        courseId: course.id,
      }) as any;

      expect(result.id).toBe(course.id);
      expect(result.is_subscribed).toBe(false);
      expect(result.is_course_in_cart).toBe(false);
    });

    it('reflects is_subscribed correctly after subscription', async () => {
      const { student, course } = await setupData();
      await studentService.createCheckout({
        id: student.id,
        courseId: course.id,
        autoApproveSubscription: true,
      });

      const result = await studentService.getOrganizationCourse({
        id: student.id,
        courseId: course.id,
      }) as any;

      expect(result.is_subscribed).toBe(true);
    });
  });

  describe('listAttempts', () => {
    it('returns an empty list when student has no ended tests', async () => {
      const { student } = await setupData();

      const result = await studentService.listAttempts({ id: student.id });

      expect(result.edges).toHaveLength(0);
    });

    it('returns enriched attempts with score, trend, and pagination', async () => {
      const { student, course, version, question } = await setupData();

      const suite = new TestSuite();
      suite.title = 'Test Suite';
      suite.description = 'Desc';
      suite.keywords = [];
      suite.course_version = version;
      await testSuiteRepository.save(suite);

      const start1 = new Date('2026-01-01T10:00:00Z');
      const start2 = new Date('2026-01-02T10:00:00Z');

      await createEndedTest(student, suite, [question], [false], start1);
      await createEndedTest(student, suite, [question], [true], start2);

      const result = await studentService.listAttempts({ id: student.id });

      expect(result.edges).toHaveLength(2);
      // most recent first
      const scores = result.edges.map((e) => (e.node as any).score);
      expect(scores[0]).toBe(100);
      expect(scores[1]).toBe(0);
      // trend on most recent: improved by 100
      expect((result.edges[0].node as any).trend).toBe(100);
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.listAttempts({ id: '00000000-0000-0000-0000-000000000000' }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  describe('getActiveTest', () => {
    it('returns the active test', async () => {
      const { student, version } = await setupData();

      const suite = new TestSuite();
      suite.title = 'Suite';
      suite.description = '';
      suite.keywords = [];
      suite.course_version = version;
      await testSuiteRepository.save(suite);

      const test = new TestEntity();
      test.status = TestStatusType.ON_GOING;
      test.mode = TestModeType.PROCTURED;
      test.test_suite = suite;
      test.student = student;
      await testRepository.save(test);

      const result = await studentService.getActiveTest({ id: student.id });

      expect(result.id).toBe(test.id);
      expect(result.status).toBe(TestStatusType.ON_GOING);
    });

    it('throws NotFoundException when there is no active test', async () => {
      const { student } = await setupData();

      await expect(
        studentService.getActiveTest({ id: student.id }),
      ).rejects.toThrow(new NotFoundException('No active test found'));
    });
  });

  describe('getTest', () => {
    it('returns the test by id', async () => {
      const { student, version, question } = await setupData();

      const suite = new TestSuite();
      suite.title = 'Suite';
      suite.description = '';
      suite.keywords = [];
      suite.course_version = version;
      await testSuiteRepository.save(suite);

      const test = await createEndedTest(
        student,
        suite,
        [question],
        [true],
        new Date(),
      );

      const result = await studentService.getTest({
        id: student.id,
        testId: test.id,
      });

      expect(result.id).toBe(test.id);
    });

    it('throws NotFoundException if test does not exist', async () => {
      const { student } = await setupData();

      await expect(
        studentService.getTest({
          id: student.id,
          testId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(new NotFoundException('Test not found'));
    });
  });

  describe('getStats', () => {
    it('returns zeroed stats when no tests exist', async () => {
      const { student } = await setupData();

      const result = await studentService.getStats({ id: student.id });

      expect(result.total_test_taken).toBe(0);
      expect(result.average_score).toBe(0);
      expect(result.study_hours).toBe(0);
      expect(result.weak_areas_count).toBe(0);
    });

    it('returns correct stats after completing tests', async () => {
      const { student, version, question } = await setupData();

      const suite = new TestSuite();
      suite.title = 'Suite';
      suite.description = '';
      suite.keywords = [];
      suite.course_version = version;
      await testSuiteRepository.save(suite);

      await createEndedTest(
        student,
        suite,
        [question],
        [true],
        new Date(),
      );

      const result = await studentService.getStats({ id: student.id });

      expect(result.total_test_taken).toBe(1);
      expect(result.average_score).toBe(100);
      expect(result.study_hours).toBeGreaterThan(0);
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.getStats({ id: '00000000-0000-0000-0000-000000000000' }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  describe('studentSubjectProgress', () => {
    it('returns empty array when student has no ended tests', async () => {
      const { student } = await setupData();

      const result = await studentService.studentSubjectProgress({
        id: student.id,
      });

      expect(result).toHaveLength(0);
    });

    it('returns subject progress grouped by course', async () => {
      const { student, version, question } = await setupData();

      const suite = new TestSuite();
      suite.title = 'Suite';
      suite.description = '';
      suite.keywords = [];
      suite.course_version = version;
      await testSuiteRepository.save(suite);

      await createEndedTest(student, suite, [question], [true], new Date());

      const result = await studentService.studentSubjectProgress({
        id: student.id,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].subject).toBeDefined();
      expect(result[0].score).toBe(100);
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.studentSubjectProgress({ id: '00000000-0000-0000-0000-000000000000' }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  describe('studentTestTopicProgress', () => {
    it('returns topic breakdown for a specific ended test', async () => {
      const { student, version, question } = await setupData();

      const suite = new TestSuite();
      suite.title = 'Suite';
      suite.description = '';
      suite.keywords = [];
      suite.course_version = version;
      await testSuiteRepository.save(suite);

      const test = await createEndedTest(
        student,
        suite,
        [question],
        [true],
        new Date(),
      );

      const result = await studentService.studentTestTopicProgress({
        id: student.id,
        testId: test.id,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].topic).toBe(QuestionTagType.TAG_ALGEBRA);
      expect(result[0].correct).toBe(1);
      expect(result[0].wrong).toBe(0);
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.studentTestTopicProgress({
          id: '00000000-0000-0000-0000-000000000000',
          testId: 'any-id',
        }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });

    it('throws NotFoundException if test is not ended', async () => {
      const { student } = await setupData();

      await expect(
        studentService.studentTestTopicProgress({
          id: student.id,
          testId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(new NotFoundException('Test not found or not yet ended'));
    });
  });

  describe('weakSubjectAreas', () => {
    it('returns empty array when student has no errors', async () => {
      const { student, version, question } = await setupData();

      const suite = new TestSuite();
      suite.title = 'Suite';
      suite.description = '';
      suite.keywords = [];
      suite.course_version = version;
      await testSuiteRepository.save(suite);

      // All correct → no weak areas
      await createEndedTest(student, suite, [question], [true], new Date());

      const result = await studentService.weakSubjectAreas({
        id: student.id,
      });

      // accuracy = 100% which is > 65, so nothing returned
      expect(result).toHaveLength(0);
    });

    it('returns weak areas when accuracy is below 65%', async () => {
      const { student, version, question } = await setupData();

      const suite = new TestSuite();
      suite.title = 'Suite';
      suite.description = '';
      suite.keywords = [];
      suite.course_version = version;
      await testSuiteRepository.save(suite);

      // All wrong → accuracy 0%
      await createEndedTest(student, suite, [question], [false], new Date());

      const result = await studentService.weakSubjectAreas({
        id: student.id,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].accuracy).toBeLessThanOrEqual(65);
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.weakSubjectAreas({ id: '00000000-0000-0000-0000-000000000000' }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  describe('getTestScoreHistory', () => {
    it('returns empty array when no ended tests exist', async () => {
      const { student } = await setupData();

      const result = await studentService.getTestScoreHistory({
        id: student.id,
      });

      expect(result).toHaveLength(0);
    });

    it('returns score history sorted most-recent-first', async () => {
      const { student, version, question } = await setupData();

      const suite = new TestSuite();
      suite.title = 'Suite';
      suite.description = '';
      suite.keywords = [];
      suite.course_version = version;
      await testSuiteRepository.save(suite);

      const start1 = new Date('2026-01-01T10:00:00Z');
      const start2 = new Date('2026-01-02T10:00:00Z');
      await createEndedTest(student, suite, [question], [false], start1);
      await createEndedTest(student, suite, [question], [true], start2);

      const result = await studentService.getTestScoreHistory({
        id: student.id,
      });

      expect(result).toHaveLength(2);
      expect(result[0].score).toBe(100);
      expect(result[1].score).toBe(0);
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.getTestScoreHistory({ id: '00000000-0000-0000-0000-000000000000' }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  describe('changeStudentPassword', () => {
    it('changes the password successfully', async () => {
      const { student } = await setupData();

      const response = await studentService.changeStudentPassword({
        id: student.id,
        currentPassword: 'password',
        newPassword: 'newpassword',
      });

      expect(response.id).toBe(student.id);
      const updated = await studentRepository.findOne({
        where: { email: student.email },
      });
      expect(await HashHelper.compare('newpassword', updated.password)).toBe(
        true,
      );
    });

    it('throws BadRequestException if current password is incorrect', async () => {
      const { student } = await setupData();

      await expect(
        studentService.changeStudentPassword({
          id: student.id,
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword',
        }),
      ).rejects.toThrow(
        new BadRequestException('Current password is incorrect'),
      );
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.changeStudentPassword({
          id: '00000000-0000-0000-0000-000000000000',
          currentPassword: 'password',
          newPassword: 'newpassword',
        }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  describe('getCurrentStreakCount', () => {
    const todayUtcNoon = () => {
      const d = new Date();
      return new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0),
      );
    };

    const daysAgoUtcNoon = (n: number) => {
      const d = todayUtcNoon();
      d.setUTCDate(d.getUTCDate() - n);
      return d;
    };

    it('returns zero streaks when student has no ended tests', async () => {
      const { student } = await setupData();

      const result = await studentService.getCurrentStreakCount({
        id: student.id,
      });

      expect(result.current_streak).toBe(0);
      expect(result.best_streak).toBe(0);
    });

    it('returns current_streak of 1 when one test was taken today', async () => {
      const { student, version, question } = await setupData();

      const suite = new TestSuite();
      suite.title = 'Streak Suite';
      suite.description = '';
      suite.keywords = [];
      suite.course_version = version;
      await testSuiteRepository.save(suite);

      await createEndedTest(student, suite, [question], [true], todayUtcNoon());

      const result = await studentService.getCurrentStreakCount({
        id: student.id,
      });

      expect(result.current_streak).toBe(1);
      expect(result.best_streak).toBe(1);
    });

    it('accumulates current_streak over consecutive days ending today', async () => {
      const { student, version, question } = await setupData();

      const suite = new TestSuite();
      suite.title = 'Streak Suite';
      suite.description = '';
      suite.keywords = [];
      suite.course_version = version;
      await testSuiteRepository.save(suite);

      await createEndedTest(student, suite, [question], [true], daysAgoUtcNoon(2));
      await createEndedTest(student, suite, [question], [true], daysAgoUtcNoon(1));
      await createEndedTest(student, suite, [question], [true], todayUtcNoon());

      const result = await studentService.getCurrentStreakCount({
        id: student.id,
      });

      expect(result.current_streak).toBe(3);
      expect(result.best_streak).toBe(3);
    });

    it('resets current_streak on a gap day and tracks best_streak separately', async () => {
      // Scenario from spec:
      //   d1 (3 days ago): 1 test  → streak running
      //   d2 (2 days ago): 2 tests → streak 2
      //   d3 (yesterday):  0 tests → GAP
      //   d4 (today):      3 tests → current_streak resets to 1, best_streak stays 2
      const { student, version, question } = await setupData();

      const suite = new TestSuite();
      suite.title = 'Streak Suite';
      suite.description = '';
      suite.keywords = [];
      suite.course_version = version;
      await testSuiteRepository.save(suite);

      await createEndedTest(student, suite, [question], [true], daysAgoUtcNoon(3));
      await createEndedTest(student, suite, [question], [true], daysAgoUtcNoon(2));
      await createEndedTest(student, suite, [question], [true], daysAgoUtcNoon(2));
      // yesterday is skipped (gap)
      await createEndedTest(student, suite, [question], [true], todayUtcNoon());
      await createEndedTest(student, suite, [question], [true], todayUtcNoon());
      await createEndedTest(student, suite, [question], [true], todayUtcNoon());

      const result = await studentService.getCurrentStreakCount({
        id: student.id,
      });

      expect(result.current_streak).toBe(1);
      expect(result.best_streak).toBe(2);
    });

    it('returns current_streak 0 when last test was more than a day ago', async () => {
      const { student, version, question } = await setupData();

      const suite = new TestSuite();
      suite.title = 'Streak Suite';
      suite.description = '';
      suite.keywords = [];
      suite.course_version = version;
      await testSuiteRepository.save(suite);

      await createEndedTest(student, suite, [question], [true], daysAgoUtcNoon(2));

      const result = await studentService.getCurrentStreakCount({
        id: student.id,
      });

      expect(result.current_streak).toBe(0);
      expect(result.best_streak).toBe(1);
    });

    it('counts multiple tests on the same day as a single streak day', async () => {
      const { student, version, question } = await setupData();

      const suite = new TestSuite();
      suite.title = 'Streak Suite';
      suite.description = '';
      suite.keywords = [];
      suite.course_version = version;
      await testSuiteRepository.save(suite);

      const today = todayUtcNoon();
      await createEndedTest(student, suite, [question], [true], today);
      await createEndedTest(
        student,
        suite,
        [question],
        [true],
        new Date(today.getTime() + 3600_000),
      );

      const result = await studentService.getCurrentStreakCount({
        id: student.id,
      });

      expect(result.current_streak).toBe(1);
      expect(result.best_streak).toBe(1);
    });

    it('throws NotFoundException when student does not exist', async () => {
      await expect(
        studentService.getCurrentStreakCount({ id: '00000000-0000-0000-0000-000000000000' }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  describe('listCourseSuitesPaginated', () => {
    const makeSuite = async (
      version: Version,
      title: string,
      suiteType: SuiteType,
    ) => {
      const suite = new TestSuite();
      suite.title = title;
      suite.description = '';
      suite.keywords = [];
      suite.suite_type = suiteType;
      suite.course_version = version;
      return testSuiteRepository.save(suite);
    };

    it('throws NotFoundException when student is not subscribed to the course', async () => {
      const { student, course } = await setupData();

      await expect(
        studentService.listCourseSuitesPaginated({
          id: student.id,
          courseId: course.id,
        }),
      ).rejects.toThrow(
        new NotFoundException(
          'Student not found or not subscribed to this course',
        ),
      );
    });

    it('returns all suites when no suiteTypes filter is provided', async () => {
      const { student, course, version } = await setupData();
      await studentService.createCheckout({
        id: student.id,
        courseId: course.id,
        autoApproveSubscription: true,
      });

      await makeSuite(version, 'Topic Suite', SuiteType.TOPIC);
      await makeSuite(version, 'Year Suite', SuiteType.YEAR);
      await makeSuite(version, 'Class Suite', SuiteType.CLASS);

      const result = await studentService.listCourseSuitesPaginated({
        id: student.id,
        courseId: course.id,
      });

      expect(result.count).toBe(3);
      expect(result.edges).toHaveLength(3);
    });

    it('filters suites by a single suite type', async () => {
      const { student, course, version } = await setupData();
      await studentService.createCheckout({
        id: student.id,
        courseId: course.id,
        autoApproveSubscription: true,
      });

      await makeSuite(version, 'Topic Suite 1', SuiteType.TOPIC);
      await makeSuite(version, 'Topic Suite 2', SuiteType.TOPIC);
      await makeSuite(version, 'Year Suite', SuiteType.YEAR);

      const result = await studentService.listCourseSuitesPaginated({
        id: student.id,
        courseId: course.id,
        suiteTypes: [SuiteType.TOPIC],
      });

      expect(result.count).toBe(2);
      result.edges.forEach((e) =>
        expect((e.node as TestSuite).suite_type).toBe(SuiteType.TOPIC),
      );
    });

    it('filters suites by multiple suite types', async () => {
      const { student, course, version } = await setupData();
      await studentService.createCheckout({
        id: student.id,
        courseId: course.id,
        autoApproveSubscription: true,
      });

      await makeSuite(version, 'Topic Suite', SuiteType.TOPIC);
      await makeSuite(version, 'Year Suite', SuiteType.YEAR);
      await makeSuite(version, 'Class Suite', SuiteType.CLASS);

      const result = await studentService.listCourseSuitesPaginated({
        id: student.id,
        courseId: course.id,
        suiteTypes: [SuiteType.TOPIC, SuiteType.CLASS],
      });

      expect(result.count).toBe(2);
      const types = result.edges.map((e) => (e.node as TestSuite).suite_type);
      expect(types).toContain(SuiteType.TOPIC);
      expect(types).toContain(SuiteType.CLASS);
      expect(types).not.toContain(SuiteType.YEAR);
    });

    it('returns empty edges when suiteTypes filter matches no suites', async () => {
      const { student, course, version } = await setupData();
      await studentService.createCheckout({
        id: student.id,
        courseId: course.id,
        autoApproveSubscription: true,
      });

      await makeSuite(version, 'Year Suite', SuiteType.YEAR);

      const result = await studentService.listCourseSuitesPaginated({
        id: student.id,
        courseId: course.id,
        suiteTypes: [SuiteType.TOPIC],
      });

      expect(result.count).toBe(0);
      expect(result.edges).toHaveLength(0);
    });

    it('paginates results with first/after cursor', async () => {
      const { student, course, version } = await setupData();
      await studentService.createCheckout({
        id: student.id,
        courseId: course.id,
        autoApproveSubscription: true,
      });

      await makeSuite(version, 'Suite A', SuiteType.TOPIC);
      await makeSuite(version, 'Suite B', SuiteType.TOPIC);
      await makeSuite(version, 'Suite C', SuiteType.TOPIC);

      const page1 = await studentService.listCourseSuitesPaginated({
        id: student.id,
        courseId: course.id,
        pagination: { first: 2 },
      });

      expect(page1.edges).toHaveLength(2);
      expect(page1.pageInfo.hasNextPage).toBe(true);

      const page2 = await studentService.listCourseSuitesPaginated({
        id: student.id,
        courseId: course.id,
        pagination: { first: 2, after: page1.pageInfo.endCursor },
      });

      expect(page2.edges).toHaveLength(1);
      expect(page2.pageInfo.hasNextPage).toBe(false);
    });
  });

  describe('getCategoryCountdown', () => {
    it('returns null countdown and null duration when no exam date is set', async () => {
      const { category } = await setupData();

      const result = await studentService.getCategoryCountdown({
        categoryId: category.id,
      });

      expect(result.categoryName).toBe('Test Category');
      expect(result.countdown).toBeNull();
      expect(result.exam_duration_days).toBeNull();
    });

    it('returns the correct countdown in days for a future exam date', async () => {
      const { category } = await setupData();

      const future = new Date();
      future.setDate(future.getDate() + 30);
      future.setHours(0, 0, 0, 0);

      category.date_of_exams = future;
      category.exam_duration_days = 7;
      await categoryRepository.save(category);

      const result = await studentService.getCategoryCountdown({
        categoryId: category.id,
      });

      expect(result.categoryName).toBe('Test Category');
      expect(result.countdown).toBe(30);
      expect(result.exam_duration_days).toBe(7);
    });

    it('returns a negative countdown when the exam date has passed', async () => {
      const { category } = await setupData();

      const past = new Date();
      past.setDate(past.getDate() - 10);
      past.setHours(0, 0, 0, 0);

      category.date_of_exams = past;
      await categoryRepository.save(category);

      const result = await studentService.getCategoryCountdown({
        categoryId: category.id,
      });

      expect(result.countdown).toBe(-10);
    });

    it('throws NotFoundException when the category does not exist', async () => {
      await expect(
        studentService.getCategoryCountdown({
          categoryId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(new NotFoundException('Category does not exist'));
    });
  });
});
