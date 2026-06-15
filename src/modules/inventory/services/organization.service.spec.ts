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
} from '../entities/course.entity';
import { IssueStatusType } from '../../review/entities/issue.entity';
import {
  QuestionDifficultyType,
  QuestionTagType,
  QuestionType,
} from '../../review/entities/question.entity';
import { ReviewStatusType } from '../../review/entities/review.entity';
import {
  VersionStatusType,
} from '../../review/entities/version.entity';
import { HashHelper } from '../../../helpers';
import { OrganizationService } from './organization.service';

describe('OrganizationService', () => {
  let module: TestingModule;
  let dataSource: DataSource;

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
      providers: [OrganizationService],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
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

  const orgInfo = {
    name: 'Test Organization',
    email: 'org@test.com',
    password: 'password',
  };

  const getOrganization = async (email: string) => {
    return organizationRepository.findOne({
      where: { email },
      relations: [
        'organizational_categories.courses',
        'organizational_courses.versions.assigned_admin',
        'admins.assigned_course_versions_for_review',
      ],
    });
  };

  const setupData = async () => {
    const organization = new Organization();
    organization.name = orgInfo.name;
    organization.email = orgInfo.email;
    organization.password = await HashHelper.encrypt(orgInfo.password);
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
    course.description = 'Test course description';
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
    course2.description = 'Second test course';
    course2.domains = [DomainType.ENGLISH];
    course2.level = LevelType.BEGINNER;
    course2.price = 200;
    course2.title = 'Second Course';
    course2.instructor = instructor;
    course2.organization = organization;
    await courseRepository.save(course2);

    const version = new Version();
    version.version_number = 1;
    version.course = course;
    await versionRepository.save(version);

    const version2 = new Version();
    version2.version_number = 1;
    version2.course = course2;
    await versionRepository.save(version2);

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

    const q1 = Object.assign(new Question(), sampleQuestion, {
      version,
    });
    const q2 = Object.assign(new Question(), sampleQuestion, {
      version: version2,
    });
    await questionRepository.save([q1, q2]);

    const reviewRequest = new ReviewRequest();
    reviewRequest.course_version = version;
    reviewRequest.organization = organization;
    await reviewRequestRepository.save(reviewRequest);

    admin.assigned_course_versions_for_review = [version, version2];
    await adminRepository.save(admin);

    return { organization, admin, instructor, version, version2, course, course2 };
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

  describe('listInstructors', () => {
    it('returns all instructors belonging to the organization', async () => {
      const { organization } = await setupData();

      const result = await organizationService.listInstructors({
        email: organization.email,
      });

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('instructor@test.com');
    });

    it('filters instructors by searchTerm', async () => {
      const { organization } = await setupData();

      const match = await organizationService.listInstructors({
        email: organization.email,
        searchTerm: 'Test Instructor',
      });
      expect(match).toHaveLength(1);

      const empty = await organizationService.listInstructors({
        email: organization.email,
        searchTerm: 'Nobody',
      });
      expect(empty).toHaveLength(0);
    });
  });

  describe('listInstructorsPaginated', () => {
    it('returns paginated instructors', async () => {
      const { organization } = await setupData();

      const result = await organizationService.listInstructorsPaginated({
        email: organization.email,
      });

      expect(result.edges).toHaveLength(1);
      expect(result.count).toBe(1);
    });
  });

  describe('listAdmins', () => {
    it('returns all admins belonging to the organization', async () => {
      const { organization } = await setupData();

      const result = await organizationService.listAdmins({
        email: organization.email,
      });

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('admin@test.com');
    });

    it('filters admins by searchTerm', async () => {
      const { organization } = await setupData();

      const match = await organizationService.listAdmins({
        email: organization.email,
        searchTerm: 'Test Admin',
      });
      expect(match).toHaveLength(1);

      const empty = await organizationService.listAdmins({
        email: organization.email,
        searchTerm: 'Nobody',
      });
      expect(empty).toHaveLength(0);
    });
  });

  describe('listAdminsPaginated', () => {
    it('returns paginated admins', async () => {
      const { organization } = await setupData();

      const result = await organizationService.listAdminsPaginated({
        email: organization.email,
      });

      expect(result.edges).toHaveLength(1);
      expect(result.count).toBe(1);
    });
  });

  describe('listCourses', () => {
    it('returns all courses for the organization', async () => {
      const { organization } = await setupData();

      const result = await organizationService.listCourses({
        email: organization.email,
      });

      expect(result).toHaveLength(2);
    });

    it('filters courses by searchTerm', async () => {
      const { organization } = await setupData();

      const match = await organizationService.listCourses({
        email: organization.email,
        searchTerm: 'Second',
      });
      expect(match).toHaveLength(1);
      expect(match[0].title).toBe('Second Course');
    });

    it('throws NotFoundException if organization does not exist', async () => {
      await expect(
        organizationService.listCourses({ email: 'nobody@test.com' }),
      ).rejects.toThrow(new NotFoundException('Organization not found'));
    });
  });

  describe('listCoursesPaginated', () => {
    it('returns paginated courses', async () => {
      const { organization } = await setupData();

      const result = await organizationService.listCoursesPaginated({
        email: organization.email,
      });

      expect(result.edges).toHaveLength(2);
      expect(result.count).toBe(2);
    });
  });

  describe('listRequestedReviews', () => {
    it('returns all review requests for the organization', async () => {
      const { organization } = await setupData();

      const result = await organizationService.listRequestedReviews({
        email: organization.email,
      });

      expect(result).toHaveLength(1);
    });

    it('throws NotFoundException if organization does not exist', async () => {
      await expect(
        organizationService.listRequestedReviews({ email: 'nobody@test.com' }),
      ).rejects.toThrow(new NotFoundException('Organization not found'));
    });
  });

  describe('listRequestedReviewsPaginated', () => {
    it('returns paginated review requests', async () => {
      const { organization } = await setupData();

      const result = await organizationService.listRequestedReviewsPaginated({
        email: organization.email,
      });

      expect(result.edges).toHaveLength(1);
      expect(result.count).toBe(1);
    });
  });

  describe('getStats', () => {
    it('returns correct organization statistics', async () => {
      const { organization, version } = await setupData();
      await setupStatsData(version);

      const response = await organizationService.getStats({
        email: organization.email,
      });

      expect(response.total_admins).toBe(1);
      expect(response.total_instructors).toBe(1);
      expect(response.total_assigned_reviews).toBe(2);
      expect(response.total_requested_reviews).toBe(1);
    });

    it('throws NotFoundException if organization does not exist', async () => {
      await expect(
        organizationService.getStats({ email: 'nobody@test.com' }),
      ).rejects.toThrow(new NotFoundException('Organization does not exist'));
    });
  });

  describe('assignCourseVersionForReview', () => {
    it('assigns the admin to the course version', async () => {
      const { organization, admin, version } = await setupData();

      const response = await organizationService.assignCourseVersionForReview({
        email: organization.email,
        versionId: version.id,
        adminId: admin.id,
      });

      expect(response.id).toBe(version.id);
      expect(response.status).toBe(VersionStatusType.IN_PROGRESS);

      const org = await getOrganization(organization.email);
      expect(
        org.organizational_courses[0].versions[0].assigned_admin.id,
      ).toBe(admin.id);
    });

    it('throws NotFoundException if organization does not exist', async () => {
      const { admin, version } = await setupData();

      await expect(
        organizationService.assignCourseVersionForReview({
          email: 'nobody@test.com',
          versionId: version.id,
          adminId: admin.id,
        }),
      ).rejects.toThrow(new NotFoundException('Organization does not exist'));
    });

    it('throws an error if admin does not belong to the organization', async () => {
      const { organization, version } = await setupData();

      await expect(
        organizationService.assignCourseVersionForReview({
          email: organization.email,
          versionId: version.id,
          adminId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow('Admin does not exist');
    });

    it('throws NotFoundException if course version is not found', async () => {
      const { organization, admin } = await setupData();

      await expect(
        organizationService.assignCourseVersionForReview({
          email: organization.email,
          versionId: '00000000-0000-0000-0000-000000000000',
          adminId: admin.id,
        }),
      ).rejects.toThrow(new NotFoundException('Course version not found'));
    });
  });

  describe('createCategory', () => {
    it('creates and returns the category linked to the organization', async () => {
      const { organization } = await setupData();

      const response = await organizationService.createCategory({
        email: organization.email,
        categoryInfo: {
          avatar_url: 'https://example.com/cat.jpg',
          name: 'Test Category',
        },
      });

      expect(response.name).toBe('Test Category');

      const org = await getOrganization(organization.email);
      expect(org.organizational_categories[0].id).toBe(response.id);
    });

    it('throws NotFoundException if organization does not exist', async () => {
      await expect(
        organizationService.createCategory({
          email: 'nobody@test.com',
          categoryInfo: { avatar_url: '', name: 'Cat' },
        }),
      ).rejects.toThrow(new NotFoundException('Organization does not exist'));
    });
  });

  describe('addCoursesToCategory', () => {
    it('adds courses to the category and returns it', async () => {
      const { organization, course, course2 } = await setupData();

      const category = await organizationService.createCategory({
        email: organization.email,
        categoryInfo: { avatar_url: 'https://example.com/cat.jpg', name: 'Cat' },
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

    it('throws NotFoundException if organization does not exist', async () => {
      const { organization, course } = await setupData();
      const category = await organizationService.createCategory({
        email: organization.email,
        categoryInfo: { avatar_url: '', name: 'Cat' },
      });

      await expect(
        organizationService.addCoursesToCategory({
          email: 'nobody@test.com',
          categoryId: category.id,
          courseIds: [course.id],
        }),
      ).rejects.toThrow(new NotFoundException('Organization does not exist'));
    });

    it('throws NotFoundException if category does not exist', async () => {
      const { organization, course } = await setupData();

      await expect(
        organizationService.addCoursesToCategory({
          email: organization.email,
          categoryId: '00000000-0000-0000-0000-000000000000',
          courseIds: [course.id],
        }),
      ).rejects.toThrow(new NotFoundException('Category does not exist'));
    });
  });

  describe('updateCategoryCountdown', () => {
    it('sets date_of_exams and exam_duration_days on the category', async () => {
      const { organization } = await setupData();

      const category = await organizationService.createCategory({
        email: organization.email,
        categoryInfo: { avatar_url: 'https://example.com/cat.jpg', name: 'BECE' },
      });

      const dateOfExams = new Date('2026-09-12');
      const result = await organizationService.updateCategoryCountdown({
        email: organization.email,
        categoryId: category.id,
        dateOfExams,
        examDurationDays: 5,
      });

      expect(result).toBe(true);

      const org = await getOrganization(organization.email);
      const saved = org.organizational_categories.find((c) => c.id === category.id);
      expect(saved.exam_duration_days).toBe(5);
    });

    it('throws NotFoundException when org email is wrong', async () => {
      const { organization } = await setupData();

      const category = await organizationService.createCategory({
        email: organization.email,
        categoryInfo: { avatar_url: '', name: 'BECE' },
      });

      await expect(
        organizationService.updateCategoryCountdown({
          email: 'nobody@test.com',
          categoryId: category.id,
          dateOfExams: new Date('2026-09-12'),
          examDurationDays: 3,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when category does not belong to the organization', async () => {
      const { organization } = await setupData();

      await expect(
        organizationService.updateCategoryCountdown({
          email: organization.email,
          categoryId: '00000000-0000-0000-0000-000000000000',
          dateOfExams: new Date('2026-09-12'),
          examDurationDays: 3,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
