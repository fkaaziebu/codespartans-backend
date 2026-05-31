import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
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
import {
  TestModeType,
  TestStatusType,
} from '../../simulation/entities/test.entity';
import { TimeEventType } from '../../simulation/entities/time_event.entity';
import { HashHelper } from '../../../helpers';
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
      providers: [StudentService],
    }).compile();

    connection = module.get<Connection>(Connection);
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
      const { student } = await setupData();

      const result = await studentService.listOrganizationCourses({
        email: student.email,
      });

      expect(result).toHaveLength(2);
      expect(result.every((c) => c.approved_version !== undefined)).toBe(true);
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.listOrganizationCourses({ email: 'nobody@test.com' }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  describe('listOrganizationCoursesPaginated', () => {
    it('returns paginated courses', async () => {
      const { student } = await setupData();

      const result = await studentService.listOrganizationCoursesPaginated({
        email: student.email,
      });

      expect(result.edges).toHaveLength(2);
      expect(result.count).toBe(2);
    });
  });

  describe('listCartCourses', () => {
    it('returns an empty list when cart is empty', async () => {
      const { student } = await setupData();

      const result = await studentService.listCartCourses({
        email: student.email,
      });

      expect(result).toHaveLength(0);
    });

    it('returns courses that are in the cart', async () => {
      const { student, course } = await setupData();
      await studentService.addCourseToCart({
        email: student.email,
        courseId: course.id,
      });

      const result = await studentService.listCartCourses({
        email: student.email,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(course.id);
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.listCartCourses({ email: 'nobody@test.com' }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  describe('listCartCategories', () => {
    it('returns an empty list when cart has no categories', async () => {
      const { student } = await setupData();

      const result = await studentService.listCartCategories({
        email: student.email,
      });

      expect(result).toHaveLength(0);
    });

    it('returns categories that are in the cart', async () => {
      const { student, category } = await setupData();
      await studentService.addCategoryToCart({
        email: student.email,
        categoryId: category.id,
      });

      const result = await studentService.listCartCategories({
        email: student.email,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(category.id);
    });
  });

  describe('listOrganizationCategories', () => {
    it('returns categories belonging to the student organization', async () => {
      const { student } = await setupData();

      const result = await studentService.listOrganizationCategories({
        email: student.email,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Category');
    });

    it('filters categories by searchTerm', async () => {
      const { student } = await setupData();

      const match = await studentService.listOrganizationCategories({
        email: student.email,
        searchTerm: 'Test',
      });
      expect(match).toHaveLength(1);

      const empty = await studentService.listOrganizationCategories({
        email: student.email,
        searchTerm: 'NonExistent',
      });
      expect(empty).toHaveLength(0);
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.listOrganizationCategories({ email: 'nobody@test.com' }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  describe('addCourseToCart', () => {
    it('adds the course to the cart and returns the updated cart', async () => {
      const { student, course, cart } = await setupData();

      const response = await studentService.addCourseToCart({
        email: student.email,
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
          email: 'nobody@test.com',
          courseId: course.id,
        }),
      ).rejects.toThrow('Student not found');
    });
  });

  describe('removeCourseFromCart', () => {
    it('removes the course from the cart', async () => {
      const { student, course } = await setupData();
      await studentService.addCourseToCart({
        email: student.email,
        courseId: course.id,
      });

      const response = await studentService.removeCourseFromCart({
        email: student.email,
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
        email: student.email,
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
        email: student.email,
        courseId: course2.id,
      });

      const response = await studentService.createCheckout({
        email: student.email,
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
        email: student.email,
        courseId: course2.id,
      });

      await studentService.createCheckout({
        email: student.email,
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
        email: student.email,
        courseId: course.id,
      });
      await studentService.addCourseToCart({
        email: student.email,
        courseId: course2.id,
      });

      await studentService.createCheckout({
        email: student.email,
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
        email: student.email,
        courseId: course.id,
      });
      await studentService.addCourseToCart({
        email: student.email,
        courseId: course2.id,
      });

      await studentService.createCheckout({
        email: student.email,
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
        email: student.email,
        courseId: course2.id,
      });
      await studentService.addCategoryToCart({
        email: student.email,
        categoryId: category.id,
      });

      await studentService.createCheckout({
        email: student.email,
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
        email: student.email,
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
        email: student.email,
        categoryId: category.id,
        courseIds: [],
      });

      await expect(
        studentService.completeSetup({
          email: student.email,
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
        email: student.email,
        courseId: course.id,
      }) as any;

      expect(result.id).toBe(course.id);
      expect(result.is_subscribed).toBe(false);
      expect(result.is_course_in_cart).toBe(false);
    });

    it('reflects is_subscribed correctly after subscription', async () => {
      const { student, course } = await setupData();
      await studentService.createCheckout({
        email: student.email,
        courseId: course.id,
        autoApproveSubscription: true,
      });

      const result = await studentService.getOrganizationCourse({
        email: student.email,
        courseId: course.id,
      }) as any;

      expect(result.is_subscribed).toBe(true);
    });
  });

  describe('listAttempts', () => {
    it('returns an empty list when student has no ended tests', async () => {
      const { student } = await setupData();

      const result = await studentService.listAttempts({ email: student.email });

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

      const result = await studentService.listAttempts({ email: student.email });

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
        studentService.listAttempts({ email: 'nobody@test.com' }),
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

      const result = await studentService.getActiveTest({ email: student.email });

      expect(result.id).toBe(test.id);
      expect(result.status).toBe(TestStatusType.ON_GOING);
    });

    it('throws NotFoundException when there is no active test', async () => {
      const { student } = await setupData();

      await expect(
        studentService.getActiveTest({ email: student.email }),
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
        email: student.email,
        testId: test.id,
      });

      expect(result.id).toBe(test.id);
    });

    it('throws NotFoundException if test does not exist', async () => {
      const { student } = await setupData();

      await expect(
        studentService.getTest({
          email: student.email,
          testId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(new NotFoundException('Test not found'));
    });
  });

  describe('getStats', () => {
    it('returns zeroed stats when no tests exist', async () => {
      const { student } = await setupData();

      const result = await studentService.getStats({ email: student.email });

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

      const result = await studentService.getStats({ email: student.email });

      expect(result.total_test_taken).toBe(1);
      expect(result.average_score).toBe(100);
      expect(result.study_hours).toBeGreaterThan(0);
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.getStats({ email: 'nobody@test.com' }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  describe('studentSubjectProgress', () => {
    it('returns empty array when student has no ended tests', async () => {
      const { student } = await setupData();

      const result = await studentService.studentSubjectProgress({
        email: student.email,
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
        email: student.email,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].subject).toBeDefined();
      expect(result[0].score).toBe(100);
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.studentSubjectProgress({ email: 'nobody@test.com' }),
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
        email: student.email,
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
          email: 'nobody@test.com',
          testId: 'any-id',
        }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });

    it('throws NotFoundException if test is not ended', async () => {
      const { student } = await setupData();

      await expect(
        studentService.studentTestTopicProgress({
          email: student.email,
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
        email: student.email,
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
        email: student.email,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].accuracy).toBeLessThanOrEqual(65);
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.weakSubjectAreas({ email: 'nobody@test.com' }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  describe('getTestScoreHistory', () => {
    it('returns empty array when no ended tests exist', async () => {
      const { student } = await setupData();

      const result = await studentService.getTestScoreHistory({
        email: student.email,
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
        email: student.email,
      });

      expect(result).toHaveLength(2);
      expect(result[0].score).toBe(100);
      expect(result[1].score).toBe(0);
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        studentService.getTestScoreHistory({ email: 'nobody@test.com' }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  describe('changeStudentPassword', () => {
    it('changes the password successfully', async () => {
      const { student } = await setupData();

      const response = await studentService.changeStudentPassword({
        email: student.email,
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
          email: student.email,
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
          email: 'nobody@test.com',
          currentPassword: 'password',
          newPassword: 'newpassword',
        }),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });
});
