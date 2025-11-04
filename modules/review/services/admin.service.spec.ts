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
  Version,
} from '../../../database/entities';
import {
  CurrencyType,
  DomainType,
  LevelType,
} from '../../../database/types/course.type';
import { IssueStatusType } from '../../../database/types/issue.type';
import {
  QuestionDifficultyType,
  QuestionTagType,
  QuestionType,
} from '../../../database/types/question.type';
import { ReviewStatusType } from '../../../database/types/review.type';
import { HashHelper } from '../../../helpers';
import { QuestionInput } from '../../../modules/inventory/inputs';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let module: TestingModule;
  let connection: Connection;

  let adminService: AdminService;
  let adminRepository: Repository<Admin>;
  let instructorRepository: Repository<Instructor>;
  let organizationRepository: Repository<Organization>;
  let courseRepository: Repository<Course>;
  let versionRepository: Repository<Version>;
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
      providers: [AdminService],
    }).compile();

    connection = module.get<Connection>(Connection);
    adminService = module.get<AdminService>(AdminService);
    instructorRepository = module.get<Repository<Instructor>>(
      getRepositoryToken(Instructor),
    );
    organizationRepository = module.get<Repository<Organization>>(
      getRepositoryToken(Organization),
    );
    adminRepository = module.get<Repository<Admin>>(getRepositoryToken(Admin));
    courseRepository = module.get<Repository<Course>>(
      getRepositoryToken(Course),
    );
    versionRepository = module.get<Repository<Version>>(
      getRepositoryToken(Version),
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

  describe('addCourseVersionReview', () => {
    it('returns the created review on the course version', async () => {
      const { version, admin } = await setupData();

      const response = await adminService.addCourseVersionReview({
        email: admin.email,
        versionId: version.id,
        reviewInfo: {
          title: 'Test Title',
          message: 'Test Message',
        },
      });

      expect(response.title).toBe('Test Title');

      const admin_data = await getAdmin(admin.email);

      expect(
        admin_data.assigned_course_versions_for_review.sort(
          (a, b) => a.version_number - b.version_number,
        )[0].reviews[0].id,
      ).toBe(response.id);
    });
  });

  describe('addReviewIssue', () => {
    it('returns the issue after adding to a review', async () => {
      const { version, admin } = await setupData();

      const review = await adminService.addCourseVersionReview({
        email: admin.email,
        versionId: version.id,
        reviewInfo: {
          title: 'Test Title',
          message: 'Test Message',
        },
      });

      const response = await adminService.addReviewIssue({
        email: admin.email,
        reviewId: review.id,
        issueInfo: {
          description: 'Test Description',
        },
      });

      expect(response.description).toBe('Test Description');

      const admin_data = await getAdmin(admin.email);

      expect(
        admin_data.assigned_course_versions_for_review[0].reviews[0].issues[0]
          .id,
      ).toBe(response.id);
    });
  });

  describe('closeIssue', () => {
    it('returns the issue after closing it', async () => {
      const { version, admin } = await setupData();

      const review = await adminService.addCourseVersionReview({
        email: admin.email,
        versionId: version.id,
        reviewInfo: {
          title: 'Test Title',
          message: 'Test Message',
        },
      });

      const issue = await adminService.addReviewIssue({
        email: admin.email,
        reviewId: review.id,
        issueInfo: {
          description: 'Test Description',
        },
      });

      expect(issue.status).toEqual(IssueStatusType.OPEN);

      const response = await adminService.closeIssue({
        email: admin.email,
        issueId: issue.id,
      });

      expect(response.status).toEqual(IssueStatusType.CLOSED);

      const admin_data = await getAdmin(admin.email);

      expect(
        admin_data.assigned_course_versions_for_review[0].reviews[0].issues[0]
          .status,
      ).toEqual(IssueStatusType.CLOSED);
    });
  });

  describe('closeReview', () => {
    it('returns the review after closing it', async () => {
      const { version, admin } = await setupData();

      const review = await adminService.addCourseVersionReview({
        email: admin.email,
        versionId: version.id,
        reviewInfo: {
          title: 'Test Title',
          message: 'Test Message',
        },
      });

      expect(review.status).toBe(ReviewStatusType.OPEN);

      const issue = await adminService.addReviewIssue({
        email: admin.email,
        reviewId: review.id,
        issueInfo: {
          description: 'Test Description',
        },
      });

      await adminService.closeIssue({
        email: admin.email,
        issueId: issue.id,
      });

      const response = await adminService.closeReview({
        email: admin.email,
        reviewId: review.id,
      });

      expect(response.status).toBe(ReviewStatusType.CLOSED);

      const admin_data = await getAdmin(admin.email);

      expect(
        admin_data.assigned_course_versions_for_review[0].reviews[0].status,
      ).toBe(ReviewStatusType.CLOSED);
    });
  });

  describe('approveCourseVersion', () => {
    it('returns the approved course version', async () => {
      const { version, admin } = await setupData();

      const review = await adminService.addCourseVersionReview({
        email: admin.email,
        versionId: version.id,
        reviewInfo: {
          title: 'Test Title',
          message: 'Test Message',
        },
      });

      const issue = await adminService.addReviewIssue({
        email: admin.email,
        reviewId: review.id,
        issueInfo: {
          description: 'Test Description',
        },
      });

      await adminService.closeIssue({
        email: admin.email,
        issueId: issue.id,
      });

      const response = await adminService.approveCourseVersion({
        email: admin.email,
        versionId: version.id,
      });

      expect(response.version_number).toBe(1);
      expect(response.id).toBe(version.id);

      const admin_data = await getAdmin(admin.email);
      expect(
        admin_data.organization.organizational_courses[0].approved_version.id,
      ).toBe(version.id);

      expect(
        admin_data.organization.organizational_courses[0].versions,
      ).toHaveLength(2);
    });
  });

  const getAdmin = async (email: string) => {
    return await adminRepository.findOne({
      where: { email },
      relations: [
        'assigned_course_versions_for_review.reviews.issues',
        'organization.organizational_courses.approved_version',
        'organization.organizational_courses.versions',
      ],
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

    // create course
    const course = new Course();
    course.avatar_url = 'https://example.com/avatar.jpg';
    course.currency = CurrencyType.USD;
    course.description = 'This is a test course';
    course.domains = [DomainType.ENGLISH];
    course.level = LevelType.BEGINNER;
    course.price = 100;
    course.title = 'Test Course';
    course.instructor = instructor;
    course.organization = organization;

    await courseRepository.save(course);

    // create course version
    const version = new Version();
    version.version_number = 1;
    version.course = course;
    version.assigned_admin = admin;

    const version2 = new Version();
    version2.version_number = 2;
    version2.course = course;
    version2.assigned_admin = admin;

    await versionRepository.save([version, version2]);
    // add questions to course version
    const questions: QuestionInput[] = [
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
    ];

    const new_questions: Question[] = await Promise.all(
      questions.map(async (question) => {
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

        return new_question;
      }),
    );

    const new_questions2: Question[] = await Promise.all(
      questions.map(async (question) => {
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
        new_question.version = version2;

        return new_question;
      }),
    );

    await questionRepository.save([...new_questions, ...new_questions2]);

    return { organization, admin, instructor, version, version2 };
  };
});
