import { NotFoundException } from '@nestjs/common';
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
import { ReviewStatusType } from '../entities/review.entity';
import { VersionStatusType } from '../entities/version.entity';
import { HashHelper } from '../../../helpers';
import { MeilisearchProducer } from './meilisearch.producer';
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
  let reviewRepository: Repository<Review>;
  let reviewRequestRepository: Repository<ReviewRequest>;

  const mockMeilisearchProducer = {
    updateMeilisearchDocuments: jest.fn().mockResolvedValue(undefined),
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
        AdminService,
        { provide: MeilisearchProducer, useValue: mockMeilisearchProducer },
      ],
    }).compile();

    connection = module.get<Connection>(Connection);
    adminService = module.get<AdminService>(AdminService);
    adminRepository = module.get<Repository<Admin>>(getRepositoryToken(Admin));
    instructorRepository = module.get<Repository<Instructor>>(getRepositoryToken(Instructor));
    organizationRepository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    courseRepository = module.get<Repository<Course>>(getRepositoryToken(Course));
    versionRepository = module.get<Repository<Version>>(getRepositoryToken(Version));
    questionRepository = module.get<Repository<Question>>(getRepositoryToken(Question));
    reviewRepository = module.get<Repository<Review>>(getRepositoryToken(Review));
    reviewRequestRepository = module.get<Repository<ReviewRequest>>(getRepositoryToken(ReviewRequest));
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

  const adminInfo = { email: 'admin@test.com', name: 'Test Admin', password: 'password' };
  const instructorInfo = { email: 'instructor@test.com', name: 'Test Instructor', password: 'password' };

  const sampleQuestion = {
    question_number: 1,
    description: 'Test question.',
    hints: ['hint'],
    solution_steps: ['step'],
    options: ['a', 'b', 'c'],
    type: QuestionType.MULTIPLE_CHOICE,
    tags: [QuestionTagType.TAG_ALGEBRA],
    difficulty: QuestionDifficultyType.EASY,
    estimated_time_in_ms: 5000,
    correct_answer: 'a',
  };

  const getAdmin = async (email: string) =>
    adminRepository.findOne({
      where: { email },
      relations: [
        'assigned_course_versions_for_review.reviews.issues',
        'organization.organizational_courses.approved_version',
        'organization.organizational_courses.versions',
      ],
    });

  const setupData = async () => {
    const organization = new Organization();
    organization.name = 'Test Organization';
    organization.email = 'org@test.com';
    organization.password = await HashHelper.encrypt('password');
    await organizationRepository.save(organization);

    const admin = new Admin();
    admin.name = adminInfo.name;
    admin.email = adminInfo.email;
    admin.password = await HashHelper.encrypt(adminInfo.password);
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
    const q2 = Object.assign(new Question(), { ...sampleQuestion, question_number: 2 }, { version: version2 });
    await questionRepository.save([q1, q2]);

    const reviewRequest = new ReviewRequest();
    reviewRequest.course_version = version;
    reviewRequest.organization = organization;
    await reviewRequestRepository.save(reviewRequest);

    return { organization, admin, instructor, course, version, version2, question: q1 };
  };

  // ─── listQuestionsForVersion ─────────────────────────────────────────────────

  describe('listQuestionsForVersion', () => {
    it('returns questions for the assigned version', async () => {
      const { admin, version } = await setupData();

      const result = await adminService.listQuestionsForVersion({
        email: admin.email,
        versionId: version.id,
      });

      expect(result).toHaveLength(1);
    });

    it('filters questions by searchTerm', async () => {
      const { admin, version } = await setupData();

      const match = await adminService.listQuestionsForVersion({
        email: admin.email,
        versionId: version.id,
        searchTerm: 'Test question',
      });
      expect(match).toHaveLength(1);

      const empty = await adminService.listQuestionsForVersion({
        email: admin.email,
        versionId: version.id,
        searchTerm: 'NonExistent',
      });
      expect(empty).toHaveLength(0);
    });
  });

  describe('listQuestionsForVersionPaginated', () => {
    it('returns paginated questions', async () => {
      const { admin, version } = await setupData();

      const result = await adminService.listQuestionsForVersionPaginated({
        email: admin.email,
        versionId: version.id,
      });

      expect(result.edges).toHaveLength(1);
      expect(result.count).toBe(1);
    });
  });

  // ─── listAssignedVersions ────────────────────────────────────────────────────

  describe('listAssignedVersions', () => {
    it('returns all versions assigned to the admin', async () => {
      const { admin } = await setupData();

      const result = await adminService.listAssignedVersions({
        email: admin.email,
        searchTerm: '',
      });

      expect(result).toHaveLength(2);
      expect((result[0] as any).total_questions).toBeDefined();
    });

    it('filters by course title searchTerm', async () => {
      const { admin } = await setupData();

      const match = await adminService.listAssignedVersions({
        email: admin.email,
        searchTerm: 'Test Course',
      });
      expect(match).toHaveLength(2);

      const empty = await adminService.listAssignedVersions({
        email: admin.email,
        searchTerm: 'NonExistent',
      });
      expect(empty).toHaveLength(0);
    });
  });

  describe('listAssignedVersionsPaginated', () => {
    it('returns paginated assigned versions', async () => {
      const { admin } = await setupData();

      const result = await adminService.listAssignedVersionsPaginated({
        email: admin.email,
      });

      expect(result.edges).toHaveLength(2);
      expect(result.count).toBe(2);
    });
  });

  // ─── getCourseVersion ────────────────────────────────────────────────────────

  describe('getCourseVersion', () => {
    it('returns the version with questions, reviews, and enriched counts', async () => {
      const { admin, version } = await setupData();

      const result = await adminService.getCourseVersion({
        email: admin.email,
        versionId: version.id,
      });

      expect(result.id).toBe(version.id);
      expect((result as any).total_questions).toBe(1);
      expect((result as any).total_reviews).toBe(0);
    });
  });

  // ─── getVersionReview ────────────────────────────────────────────────────────

  describe('getVersionReview', () => {
    it('returns the review with issues and course details', async () => {
      const { admin, version } = await setupData();

      const review = await adminService.addCourseVersionReview({
        email: admin.email,
        versionId: version.id,
        reviewInfo: { title: 'Rev', message: 'Msg' },
      });

      const result = await adminService.getVersionReview({
        email: admin.email,
        reviewId: review.id,
      });

      expect(result.id).toBe(review.id);
      expect(result.course_version).toBeDefined();
    });
  });

  // ─── addCourseVersionReview ──────────────────────────────────────────────────

  describe('addCourseVersionReview', () => {
    it('creates and returns the review on the assigned version', async () => {
      const { admin, version } = await setupData();

      const response = await adminService.addCourseVersionReview({
        email: admin.email,
        versionId: version.id,
        reviewInfo: { title: 'Test Title', message: 'Test Message' },
      });

      expect(response.title).toBe('Test Title');

      const adminData = await getAdmin(admin.email);
      expect(
        adminData.assigned_course_versions_for_review
          .sort((a, b) => a.version_number - b.version_number)[0]
          .reviews[0].id,
      ).toBe(response.id);
    });

    it('throws NotFoundException if admin does not exist', async () => {
      const { version } = await setupData();

      await expect(
        adminService.addCourseVersionReview({
          email: 'nobody@test.com',
          versionId: version.id,
          reviewInfo: { title: 'T', message: 'M' },
        }),
      ).rejects.toThrow(new NotFoundException('Admin does not exist'));
    });

    it('throws NotFoundException if version is not assigned to this admin', async () => {
      const { admin } = await setupData();

      await expect(
        adminService.addCourseVersionReview({
          email: admin.email,
          versionId: '00000000-0000-0000-0000-000000000000',
          reviewInfo: { title: 'T', message: 'M' },
        }),
      ).rejects.toThrow(new NotFoundException('Course version not found'));
    });
  });

  // ─── addReviewIssue ──────────────────────────────────────────────────────────

  describe('addReviewIssue', () => {
    it('creates and returns the issue on the review', async () => {
      const { admin, version } = await setupData();

      const review = await adminService.addCourseVersionReview({
        email: admin.email,
        versionId: version.id,
        reviewInfo: { title: 'Rev', message: 'Msg' },
      });

      const response = await adminService.addReviewIssue({
        email: admin.email,
        reviewId: review.id,
        issueInfo: { description: 'Test Description' },
      });

      expect(response.description).toBe('Test Description');
      expect(response.status).toBe(IssueStatusType.OPEN);

      const adminData = await getAdmin(admin.email);
      expect(
        adminData.assigned_course_versions_for_review[0].reviews[0].issues[0].id,
      ).toBe(response.id);
    });

    it('throws NotFoundException if admin does not exist', async () => {
      await expect(
        adminService.addReviewIssue({
          email: 'nobody@test.com',
          reviewId: '00000000-0000-0000-0000-000000000000',
          issueInfo: { description: 'D' },
        }),
      ).rejects.toThrow(new NotFoundException('Admin does not exist'));
    });

    it('throws NotFoundException if review is not found', async () => {
      const { admin } = await setupData();

      await expect(
        adminService.addReviewIssue({
          email: admin.email,
          reviewId: '00000000-0000-0000-0000-000000000000',
          issueInfo: { description: 'D' },
        }),
      ).rejects.toThrow(new NotFoundException('Review not found'));
    });
  });

  // ─── closeIssue ──────────────────────────────────────────────────────────────

  describe('closeIssue', () => {
    it('closes an open issue and returns it', async () => {
      const { admin, version } = await setupData();

      const review = await adminService.addCourseVersionReview({
        email: admin.email,
        versionId: version.id,
        reviewInfo: { title: 'Rev', message: 'Msg' },
      });
      const issue = await adminService.addReviewIssue({
        email: admin.email,
        reviewId: review.id,
        issueInfo: { description: 'D' },
      });

      expect(issue.status).toBe(IssueStatusType.OPEN);

      const response = await adminService.closeIssue({
        email: admin.email,
        issueId: issue.id,
      });

      expect(response.status).toBe(IssueStatusType.CLOSED);

      const adminData = await getAdmin(admin.email);
      expect(
        adminData.assigned_course_versions_for_review[0].reviews[0].issues[0].status,
      ).toBe(IssueStatusType.CLOSED);
    });

    it('throws NotFoundException if admin does not exist', async () => {
      await expect(
        adminService.closeIssue({
          email: 'nobody@test.com',
          issueId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(new NotFoundException('Admin does not exist'));
    });

    it('throws NotFoundException if issue is not found', async () => {
      const { admin } = await setupData();

      await expect(
        adminService.closeIssue({
          email: admin.email,
          issueId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(new NotFoundException('Issue not found'));
    });
  });

  // ─── closeReview ─────────────────────────────────────────────────────────────

  describe('closeReview', () => {
    it('closes an open review and returns it', async () => {
      const { admin, version } = await setupData();

      const review = await adminService.addCourseVersionReview({
        email: admin.email,
        versionId: version.id,
        reviewInfo: { title: 'Rev', message: 'Msg' },
      });

      expect(review.status).toBe(ReviewStatusType.OPEN);

      const response = await adminService.closeReview({
        email: admin.email,
        reviewId: review.id,
      });

      expect(response.status).toBe(ReviewStatusType.CLOSED);

      const updatedReview = await reviewRepository.findOne({
        where: { id: review.id },
      });
      expect(updatedReview.status).toBe(ReviewStatusType.CLOSED);
    });

    it('throws NotFoundException if admin does not exist', async () => {
      await expect(
        adminService.closeReview({
          email: 'nobody@test.com',
          reviewId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(new NotFoundException('Admin does not exist'));
    });

    it('throws NotFoundException if review is not found', async () => {
      const { admin } = await setupData();

      await expect(
        adminService.closeReview({
          email: admin.email,
          reviewId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(new NotFoundException('Review not found'));
    });
  });

  // ─── approveCourseVersion ────────────────────────────────────────────────────

  describe('approveCourseVersion', () => {
    it('approves the version, sets it as approved on course, and calls meilisearch', async () => {
      const { admin, version } = await setupData();

      const response = await adminService.approveCourseVersion({
        email: admin.email,
        versionId: version.id,
      });

      expect(response.id).toBe(version.id);
      expect(response.status).toBe(VersionStatusType.APPROVED);
      expect(mockMeilisearchProducer.updateMeilisearchDocuments).toHaveBeenCalled();

      const adminData = await getAdmin(admin.email);
      expect(
        adminData.organization.organizational_courses[0].approved_version.id,
      ).toBe(version.id);
    });

    it('throws NotFoundException if admin does not exist', async () => {
      const { version } = await setupData();

      await expect(
        adminService.approveCourseVersion({
          email: 'nobody@test.com',
          versionId: version.id,
        }),
      ).rejects.toThrow(new NotFoundException('Admin does not exist'));
    });

    it('throws NotFoundException if version is not assigned to this admin', async () => {
      const { admin } = await setupData();

      await expect(
        adminService.approveCourseVersion({
          email: admin.email,
          versionId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(new NotFoundException('Course version not found'));
    });
  });
});
