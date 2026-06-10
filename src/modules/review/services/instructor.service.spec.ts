import { NotFoundException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
} from '../../inventory/entities/course.entity';
import { IssueStatusType } from '../entities/issue.entity';
import {
  QuestionDifficultyType,
  QuestionTagType,
  QuestionType,
} from '../entities/question.entity';
import { VersionStatusType } from '../entities/version.entity';
import { HashHelper } from '../../../helpers';
import { InstructorService } from './instructor.service';

describe('InstructorService', () => {
  let module: TestingModule;
  let dataSource: DataSource;

  let instructorService: InstructorService;
  let adminRepository: Repository<Admin>;
  let instructorRepository: Repository<Instructor>;
  let organizationRepository: Repository<Organization>;
  let courseRepository: Repository<Course>;
  let versionRepository: Repository<Version>;
  let questionRepository: Repository<Question>;
  let reviewRepository: Repository<Review>;
  let issueRepository: Repository<Issue>;
  let reviewRequestRepository: Repository<ReviewRequest>;

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
      providers: [InstructorService],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    instructorService = module.get<InstructorService>(InstructorService);
    instructorRepository = module.get<Repository<Instructor>>(getRepositoryToken(Instructor));
    organizationRepository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    adminRepository = module.get<Repository<Admin>>(getRepositoryToken(Admin));
    courseRepository = module.get<Repository<Course>>(getRepositoryToken(Course));
    versionRepository = module.get<Repository<Version>>(getRepositoryToken(Version));
    questionRepository = module.get<Repository<Question>>(getRepositoryToken(Question));
    reviewRepository = module.get<Repository<Review>>(getRepositoryToken(Review));
    issueRepository = module.get<Repository<Issue>>(getRepositoryToken(Issue));
    reviewRequestRepository = module.get<Repository<ReviewRequest>>(getRepositoryToken(ReviewRequest));
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

  // ─── helpers ────────────────────────────────────────────────────────────────

  const instructorInfo = { email: 'instructor@test.com', name: 'Test Instructor', password: 'password' };

  const sampleQuestion = {
    question_number: 1,
    description: 'Heyyaaa test question.',
    hints: ['hint one'],
    solution_steps: ['step one'],
    options: ['option one', 'option two', 'option three'],
    type: QuestionType.MULTIPLE_CHOICE,
    tags: [QuestionTagType.TAG_ALGEBRA],
    difficulty: QuestionDifficultyType.EASY,
    estimated_time_in_ms: 10000,
    correct_answer: 'option one',
  };

  const getInstructor = async (email: string) =>
    instructorRepository.findOne({
      where: { email },
      relations: ['created_courses.versions.reviews.issues'],
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
    instructor.name = instructorInfo.name;
    instructor.email = instructorInfo.email;
    instructor.password = await HashHelper.encrypt(instructorInfo.password);
    instructor.organizations = [organization];
    await instructorRepository.save(instructor);

    const course = new Course();
    course.avatar_url = 'https://example.com/avatar.jpg';
    course.currency = CurrencyType.USD;
    course.description = 'Test course description';
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
    version.assigned_admin = admin;

    const version2 = new Version();
    version2.version_number = 2;
    version2.course = course;
    version2.assigned_admin = admin;

    await versionRepository.save([version, version2]);

    const q1 = Object.assign(new Question(), sampleQuestion, { version });
    const q2 = Object.assign(new Question(), { ...sampleQuestion, question_number: 2, description: 'Heyyaaa test question 2.' }, { version: version2 });
    await questionRepository.save([q1, q2]);

    const reviewRequest = new ReviewRequest();
    reviewRequest.course_version = version;
    reviewRequest.organization = organization;
    await reviewRequestRepository.save(reviewRequest);

    const review = new Review();
    review.title = 'Review title';
    review.message = 'Review message';
    review.course_version = version;
    await reviewRepository.save(review);

    const issue = new Issue();
    issue.description = 'Issue description';
    issue.review = review;
    await issueRepository.save(issue);

    return { organization, admin, instructor, course, version, version2, question: q1, review, issue };
  };

  // ─── listCourses ─────────────────────────────────────────────────────────────

  describe('listCourses', () => {
    it('returns all courses belonging to the instructor', async () => {
      const { instructor } = await setupData();

      const result = await instructorService.listCourses({
        email: instructor.email,
      });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Course');
    });

    it('filters by searchTerm', async () => {
      const { instructor } = await setupData();

      const match = await instructorService.listCourses({
        email: instructor.email,
        searchTerm: 'Test',
      });
      expect(match).toHaveLength(1);

      const empty = await instructorService.listCourses({
        email: instructor.email,
        searchTerm: 'NonExistent',
      });
      expect(empty).toHaveLength(0);
    });
  });

  describe('listCoursesPaginated', () => {
    it('returns paginated courses', async () => {
      const { instructor } = await setupData();

      const result = await instructorService.listCoursesPaginated({
        email: instructor.email,
      });

      expect(result.edges).toHaveLength(1);
      expect(result.count).toBe(1);
    });
  });

  // ─── getCourse ───────────────────────────────────────────────────────────────

  describe('getCourse', () => {
    it('returns the course with versions and approved version', async () => {
      const { instructor, course, version } = await setupData();

      // Mark approved so we get the approved_version relation
      course.approved_version = version;
      await courseRepository.save(course);

      const result = await instructorService.getCourse({
        email: instructor.email,
        courseId: course.id,
      });

      expect(result.id).toBe(course.id);
      expect(result.versions).toHaveLength(2);
      expect(result.approved_version.id).toBe(version.id);
    });
  });

  // ─── listQuestionsForVersion ──────────────────────────────────────────────────

  describe('listQuestionsForVersion', () => {
    it('returns questions for a version belonging to the instructor course', async () => {
      const { instructor, version } = await setupData();

      const result = await instructorService.listQuestionsForVersion({
        email: instructor.email,
        versionId: version.id,
      });

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe(sampleQuestion.description);
    });

    it('filters by searchTerm', async () => {
      const { instructor, version } = await setupData();

      const match = await instructorService.listQuestionsForVersion({
        email: instructor.email,
        versionId: version.id,
        searchTerm: 'Heyyaaa',
      });
      expect(match).toHaveLength(1);

      const empty = await instructorService.listQuestionsForVersion({
        email: instructor.email,
        versionId: version.id,
        searchTerm: 'NonExistent',
      });
      expect(empty).toHaveLength(0);
    });
  });

  describe('listQuestionsForVersionPaginated', () => {
    it('returns paginated questions', async () => {
      const { instructor, version } = await setupData();

      const result = await instructorService.listQuestionsForVersionPaginated({
        email: instructor.email,
        versionId: version.id,
      });

      expect(result.edges).toHaveLength(1);
      expect(result.count).toBe(1);
    });
  });

  // ─── getCourseVersion ────────────────────────────────────────────────────────

  describe('getCourseVersion', () => {
    it('returns version with questions, reviews, and enriched counts', async () => {
      const { instructor, version } = await setupData();

      const result = await instructorService.getCourseVersion({
        email: instructor.email,
        versionId: version.id,
      });

      expect(result.id).toBe(version.id);
      expect((result as any).total_questions).toBe(1);
      expect((result as any).total_reviews).toBe(1);
      expect((result as any).reviews[0].total_issues).toBe(1);
    });
  });

  // ─── getVersionReview ────────────────────────────────────────────────────────

  describe('getVersionReview', () => {
    it('returns the review with issues and course_version details', async () => {
      const { instructor, review } = await setupData();

      const result = await instructorService.getVersionReview({
        email: instructor.email,
        reviewId: review.id,
      });

      expect(result.id).toBe(review.id);
      expect(result.issues).toHaveLength(1);
      expect(result.course_version).toBeDefined();
    });
  });

  // ─── updateIssueStatus ───────────────────────────────────────────────────────

  describe('updateIssueStatus', () => {
    it('updates the issue status and response, returns the updated issue', async () => {
      const { instructor, issue } = await setupData();

      expect(issue.status).toBe(IssueStatusType.OPEN);

      const result = await instructorService.updateIssueStatus({
        email: instructor.email,
        issueId: issue.id,
        issueStatus: IssueStatusType.IN_PROGRESS,
        response: 'Working on it',
      });

      expect(result.status).toBe(IssueStatusType.IN_PROGRESS);
      expect(result.response).toBe('Working on it');

      const instructorData = await getInstructor(instructor.email);
      expect(
        instructorData.created_courses[0].versions
          .sort((a, b) => a.version_number - b.version_number)[0]
          .reviews[0].issues[0].status,
      ).toBe(IssueStatusType.IN_PROGRESS);
    });

    it('throws NotFoundException if instructor does not exist', async () => {
      const { issue } = await setupData();

      await expect(
        instructorService.updateIssueStatus({
          email: 'nobody@test.com',
          issueId: issue.id,
          issueStatus: IssueStatusType.IN_PROGRESS,
          response: 'OK',
        }),
      ).rejects.toThrow(new NotFoundException('Instructor does not exist'));
    });

    it('throws NotFoundException if issue is not found', async () => {
      const { instructor } = await setupData();

      await expect(
        instructorService.updateIssueStatus({
          email: instructor.email,
          issueId: '00000000-0000-0000-0000-000000000000',
          issueStatus: IssueStatusType.CLOSED,
          response: 'Done',
        }),
      ).rejects.toThrow(new NotFoundException('Issue not found'));
    });
  });
});
