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
  Issue,
  Organization,
  Question,
  Review,
  ReviewRequest,
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
import { QuestionInput } from '../inputs';
import { OrganizationService } from './organization.service';

describe('OrganizationService', () => {
  let module: TestingModule;
  let connection: Connection;

  let organizationService: OrganizationService;
  let adminRepository: Repository<Admin>;
  let instructorRepository: Repository<Instructor>;
  let organizationRepository: Repository<Organization>;
  let courseRepository: Repository<Course>;
  let versionRepository: Repository<Version>;
  let questionRepository: Repository<Question>;
  let reviewRequestRepository: Repository<ReviewRequest>;
  let reviewRepository: Repository<Review>;
  let issueRepository: Repository<Issue>;

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
      providers: [OrganizationService],
    }).compile();

    connection = module.get<Connection>(Connection);
    organizationService = module.get<OrganizationService>(OrganizationService);
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
    reviewRequestRepository = module.get<Repository<ReviewRequest>>(
      getRepositoryToken(ReviewRequest),
    );
    issueRepository = module.get<Repository<Issue>>(getRepositoryToken(Issue));
    reviewRepository = module.get<Repository<Review>>(
      getRepositoryToken(Review),
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

  describe('assignCourseVersionForReview', () => {
    it('returns the updated course version with the assigned admin', async () => {
      const { organization, admin, version } = await setupData();

      const response = await organizationService.assignCourseVersionForReview({
        email: organization.email,
        versionId: version.id,
        adminId: admin.id,
      });

      expect(response.id).toBe(version.id);

      const org = await getOrganization(organization.email);

      expect(org.organizational_courses[0].versions[0].assigned_admin.id).toBe(
        admin.id,
      );
      expect(org.admins[0].assigned_course_versions_for_review[0].id).toBe(
        version.id,
      );
    });
  });

  describe('createCategory', () => {
    it('returns created category', async () => {
      const { organization } = await setupData();

      const response = await organizationService.createCategory({
        email: organization.email,
        categoryInfo: {
          avatar_url: 'https://example.com/avatar.jpg',
          name: 'Test Category',
        },
      });

      expect(response.name).toBe('Test Category');

      const org = await getOrganization(organization.email);

      expect(org.organizational_categories[0].id).toBe(response.id);
      expect(org.organizational_categories[0].name).toBe('Test Category');
    });
  });

  describe('addCourseToCategory', () => {
    it('returns category with courses', async () => {
      const { organization, course, course2 } = await setupData();

      const category = await organizationService.createCategory({
        email: organization.email,
        categoryInfo: {
          avatar_url: 'https://example.com/avatar.jpg',
          name: 'Test Category',
        },
      });

      const response = await organizationService.addCoursesToCategory({
        email: organization.email,
        categoryId: category.id,
        courseIds: [course.id, course2.id],
      });

      expect(response.courses).toHaveLength(2);

      const org = await getOrganization(organization.email);

      expect(org.organizational_categories[0].courses).toHaveLength(2);
    });
  });

  describe('getStats', () => {
    it('returns organization stats', async () => {
      const { organization, version } = await setupData();
      await setupStatsData(version);

      const response = await organizationService.getStats({
        email: organization.email,
      });

      expect(response.total_admins).toEqual(1);
      expect(response.total_instructors).toEqual(1);
      expect(response.total_assigned_reviews).toEqual(2);
      expect(response.total_requested_reviews).toEqual(1);
    });
  });

  const getOrganization = async (email: string) => {
    return await organizationRepository.findOne({
      where: { email },
      relations: [
        'organizational_categories.courses',
        'organizational_courses.versions.assigned_admin',
        'admins.assigned_course_versions_for_review',
      ],
    });
  };

  const setupStatsData = async (courseVersion: Version) => {
    const review = new Review();
    review.title = 'Review Title';
    review.message = 'Review Message';
    review.status = ReviewStatusType.CLOSED;
    review.course_version = courseVersion;

    await reviewRepository.save(review);

    const issue = new Issue();
    issue.description = 'Issue Description';
    issue.status = IssueStatusType.CLOSED;
    issue.review = review;

    await issueRepository.save(issue);

    courseVersion.course.approved_version = courseVersion;
    await courseRepository.save(courseVersion.course);
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

    const course2 = new Course();
    course2.avatar_url = 'https://example.com/avatar.jpg';
    course2.currency = CurrencyType.USD;
    course2.description = 'This is a test course';
    course2.domains = [DomainType.ENGLISH];
    course2.level = LevelType.BEGINNER;
    course2.price = 100;
    course2.title = 'Test Course';
    course2.instructor = instructor;
    course2.organization = organization;

    await courseRepository.save(course2);

    // create course version
    const version = new Version();
    version.version_number = 1;
    version.course = course;

    await versionRepository.save(version);

    const version2 = new Version();
    version2.version_number = 2;
    version2.course = course2;

    await versionRepository.save(version2);
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

    const reviewRequest = new ReviewRequest();
    reviewRequest.course_version = version;
    reviewRequest.organization = organization;

    await reviewRequestRepository.save(reviewRequest);

    admin.assigned_course_versions_for_review = [version, version2];
    await adminRepository.save(admin);

    return { organization, admin, instructor, version, course, course2 };
  };
});
