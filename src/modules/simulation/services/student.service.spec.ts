import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import {
  Admin,
  Course,
  entities,
  Instructor,
  Organization,
  Question,
  Student,
  TestSuite,
  Version,
} from '../../../database/entities';
import {
  CurrencyType,
  DomainType,
  LevelType,
} from '../../../database/types/course.type';
import {
  QuestionDifficultyType,
  QuestionTagType,
  QuestionType,
} from '../../../database/types/question.type';
import { HashHelper } from '../../../helpers';
import { StudentService } from './student.service';
import { TestStatusType } from '../../../database/types/test.type';
import { TimeEventType } from '../../../database/entities/time_event.entity';

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
    testSuiteRepository = module.get<Repository<TestSuite>>(
      getRepositoryToken(TestSuite),
    );
    questionRepository = module.get<Repository<Question>>(
      getRepositoryToken(Question),
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

  describe('startTest', () => {
    it('returns test with id and status after successfully creating test', async () => {
      const { suite, student } = await setupData();

      const response = await studentService.startTest({
        email: instructorInfo.email,
        suiteId: suite.id,
      });

      expect(response.status).toBe(TestStatusType.ON_GOING);

      const std = await getStudent(student.id);

      expect(std.tests[0].id).toEqual(response.id);
    });
  });

  describe('pauseTest', () => {
    it('returns paused test with id and status after successfully pausing test', async () => {
      const { suite, student } = await setupData();

      const test = await studentService.startTest({
        email: instructorInfo.email,
        suiteId: suite.id,
      });

      const response = await studentService.pauseTest({
        email: instructorInfo.email,
        testId: test.id,
      });

      expect(response.status).toBe(TestStatusType.PAUSED);

      const std = await getStudent(student.id);

      expect(std.tests[0].status).toEqual(response.status);
      expect(std.tests[0].time_events.length).toEqual(2);
      expect(std.tests[0].time_events.map((e) => e.type)).toContain(
        TimeEventType.PAUSED,
      );
    });
  });

  describe('resumeTest', () => {
    it('returns resumed test with id and status after successfully resuming test', async () => {
      const { suite, student } = await setupData();

      let test = await studentService.startTest({
        email: instructorInfo.email,
        suiteId: suite.id,
      });

      test = await studentService.pauseTest({
        email: instructorInfo.email,
        testId: test.id,
      });

      const response = await studentService.resumeTest({
        email: instructorInfo.email,
        testId: test.id,
      });

      expect(response.status).toBe(TestStatusType.ON_GOING);

      const std = await getStudent(student.id);

      expect(std.tests[0].status).toEqual(response.status);
      expect(std.tests[0].time_events.length).toEqual(3);
      expect(std.tests[0].time_events.map((e) => e.type)).toContain(
        TimeEventType.RESUMED,
      );
    });
  });

  describe('endTest', () => {
    it('returns ended test with id and status after successfully ending test', async () => {
      const { suite, student } = await setupData();

      let test = await studentService.startTest({
        email: instructorInfo.email,
        suiteId: suite.id,
      });

      test = await studentService.pauseTest({
        email: instructorInfo.email,
        testId: test.id,
      });

      test = await studentService.resumeTest({
        email: instructorInfo.email,
        testId: test.id,
      });

      const response = await studentService.endTest({
        email: instructorInfo.email,
        testId: test.id,
      });

      expect(response.status).toBe(TestStatusType.ENDED);

      const std = await getStudent(student.id);

      expect(std.tests[0].status).toEqual(response.status);
      expect(std.tests[0].time_events.length).toEqual(4);
      expect(std.tests[0].time_events.map((e) => e.type)).toContain(
        TimeEventType.ENDED,
      );
    });
  });

  describe('getQuestion', () => {
    it('returns question with only the relevant fields', async () => {
      const { suite } = await setupData();

      const test = await studentService.startTest({
        email: instructorInfo.email,
        suiteId: suite.id,
      });

      const response = await studentService.getQuestion({
        email: instructorInfo.email,
        testId: test.id,
      });

      expect(response).toBeDefined();
    });
  });

  describe('submitAnswer', () => {
    it('returns submitted answer after submission', async () => {
      const { suite, student } = await setupData();

      const test = await studentService.startTest({
        email: instructorInfo.email,
        suiteId: suite.id,
      });

      const question1 = await studentService.getQuestion({
        email: instructorInfo.email,
        testId: test.id,
      });

      const response1 = await studentService.submitAnswer({
        email: instructorInfo.email,
        testId: test.id,
        questionId: question1.id,
        timeRange: `${new Date().getTime()}#${new Date().getTime() + 10000}`,
        answer: 'option one',
      });

      expect(response1.question_id).toEqual(question1.id);

      const std1 = await getStudent(student.id);

      expect(std1.tests[0].submitted_answers[0].id).toEqual(response1.id);

      const question2 = await studentService.getQuestion({
        email: instructorInfo.email,
        testId: test.id,
      });

      const response2 = await studentService.submitAnswer({
        email: instructorInfo.email,
        testId: test.id,
        questionId: question2.id,
        timeRange: `${new Date().getTime()}#${new Date().getTime() + 10000}`,
        answer: 'option one',
      });

      expect(response2.question_id).toEqual(question2.id);

      const std2 = await getStudent(student.id);

      expect(std2.tests[0].submitted_answers[1].id).toEqual(response2.id);

      expect(question1.id).not.toEqual(question2.id);
    });
  });

  const instructorInfo = {
    email: 'test@example.com',
    questions: [
      {
        question_number: 1,
        description: 'Heyyaaa test question 1.',
        hints: ['hint one', 'hint two', 'hint three'],
        solution_steps: ['step one', 'step two', 'step three'],
        options: ['option one', 'option two', 'option three'],
        type: QuestionType.MULTIPLE_CHOICE,
        tags: [QuestionTagType.TAG_ALGORITHM],
        difficulty: QuestionDifficultyType.EASY,
        estimated_time_in_ms: 10000,
        correct_answer: 'option one',
      },
      {
        question_number: 2,
        description: 'Heyyaaa test question 2.',
        hints: ['hint one', 'hint two', 'hint three'],
        solution_steps: ['step one', 'step two', 'step three'],
        options: ['option one', 'option two', 'option three'],
        type: QuestionType.MULTIPLE_CHOICE,
        tags: [QuestionTagType.TAG_ALGORITHM],
        difficulty: QuestionDifficultyType.EASY,
        estimated_time_in_ms: 10000,
        correct_answer: 'option one',
      },
    ],
  };

  const courseInfo = {
    avatar_url: 'https://example.com/avatar.jpg',
    currency: CurrencyType.USD,
    description: 'This is a test course',
    domains: [DomainType.ENGLISH],
    level: LevelType.BEGINNER,
    price: 100,
    title: 'Test Course',
  };

  const getStudent = async (studentId: string) => {
    return studentRepository.findOne({
      where: {
        id: studentId,
      },
      relations: ['tests.submitted_answers', 'tests.time_events'],
    });
  };

  const setupData = async () => {
    const organization = new Organization();
    organization.name = 'Test Organization';
    organization.email = 'test@example.com';
    organization.password = await HashHelper.encrypt('password');

    await organizationRepository.save(organization);

    const admin = new Admin();
    admin.name = 'Test Organization';
    admin.email = 'test@example.com';
    admin.password = await HashHelper.encrypt('password');
    admin.organization = organization;

    await adminRepository.save(admin);

    const instructor = new Instructor();
    instructor.name = 'Test Organization';
    instructor.email = 'test@example.com';
    instructor.password = await HashHelper.encrypt('password');
    instructor.organizations = [organization];

    await instructorRepository.save(instructor);

    const course = new Course();
    course.avatar_url = courseInfo.avatar_url;
    course.currency = courseInfo.currency;
    course.description = courseInfo.description;
    course.domains = courseInfo.domains;
    course.level = courseInfo.level;
    course.price = courseInfo.price;
    course.title = courseInfo.title;
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
    suite.keywords = ['suiteKeywords'];
    suite.course_version = version;

    await testSuiteRepository.save(suite);

    // create questions
    const new_questions: Question[] = await Promise.all(
      instructorInfo.questions.map(async (question) => {
        const new_question = new Question();
        new_question.correct_answer = question.correct_answer;
        new_question.description = question.description;
        new_question.difficulty = question.difficulty;
        new_question.estimated_time_in_ms = question.estimated_time_in_ms;
        new_question.hints = question.hints;
        new_question.options = question.options;
        new_question.question_number = question.question_number;
        new_question.solution_steps = question.solution_steps;
        new_question.tags = question.tags;
        new_question.type = question.type;
        new_question.version = version;
        new_question.test_suite = suite;

        return new_question;
      }),
    );

    await questionRepository.save(new_questions);

    const student = new Student();
    student.name = 'Test Student';
    student.email = 'test@example.com';
    student.password = await HashHelper.encrypt('password');
    student.organizations = [organization];
    student.subscribed_courses = [course];

    await studentRepository.save(student);

    return { suite, student };
  };
});
