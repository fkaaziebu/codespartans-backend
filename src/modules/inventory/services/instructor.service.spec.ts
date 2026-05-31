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
import { VersionStatusType } from '../../review/entities/version.entity';
import { HashHelper } from '../../../helpers';
import { CourseInfoInput, QuestionInput } from '../inputs';
import { InstructorService } from './instructor.service';

describe('InstructorService', () => {
  let module: TestingModule;
  let connection: Connection;

  let instructorService: InstructorService;
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
      providers: [InstructorService],
    }).compile();

    connection = module.get<Connection>(Connection);
    instructorService = module.get<InstructorService>(InstructorService);
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

  const instructorInfo = {
    email: 'instructor@test.com',
    name: 'Test Instructor',
    password: 'password',
  };

  const courseInfo: CourseInfoInput = {
    avatar_url: 'https://example.com/avatar.jpg',
    currency: CurrencyType.USD,
    description: 'This is a test course',
    domains: [DomainType.ENGLISH],
    level: LevelType.BEGINNER,
    price: 100,
    title: 'Test Course',
  };

  const sampleQuestions: QuestionInput[] = [
    {
      question_number: 1,
      description: 'Heyyaaa test question 1.',
      hints: ['hint one', 'hint two'],
      solution_steps: ['step one', 'step two'],
      options: ['option one', 'option two', 'option three'],
      type: QuestionType.MULTIPLE_CHOICE,
      tags: [QuestionTagType.TAG_ALGEBRA],
      difficulty: QuestionDifficultyType.EASY,
      estimated_time_in_ms: 10000,
      correct_answer: 'option one',
    },
    {
      question_number: 2,
      description: 'Heyyaaa test question 2.',
      hints: ['hint one', 'hint two'],
      solution_steps: ['step one', 'step two'],
      options: ['option one', 'option two', 'option three'],
      type: QuestionType.MULTIPLE_CHOICE,
      tags: [QuestionTagType.TAG_ALGEBRA],
      difficulty: QuestionDifficultyType.EASY,
      estimated_time_in_ms: 10000,
      correct_answer: 'option two',
    },
  ];

  const getInstructor = async (email: string) => {
    return instructorRepository.findOne({
      where: { email },
      relations: [
        'created_courses.organization',
        'created_courses.versions.questions',
        'created_courses.versions.review_request.organization',
        'created_courses.versions.review_request.course_version',
      ],
    });
  };

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

    return { organization, admin, instructor };
  };

  const setupCourseWithVersion = async () => {
    const { organization, instructor } = await setupData();
    const course = await instructorService.createCourse({
      email: instructorInfo.email,
      courseInfo,
      organizationId: organization.id,
    });
    const version = await instructorService.addCourseVersion({
      email: instructorInfo.email,
      courseId: course.id,
    });
    return { organization, instructor, course, version };
  };

  describe('createCourse', () => {
    it('returns the created course with correct fields', async () => {
      const { organization } = await setupData();

      const response = await instructorService.createCourse({
        email: instructorInfo.email,
        courseInfo,
        organizationId: organization.id,
      });

      expect(response.title).toBe(courseInfo.title);
      expect(response.description).toBe(courseInfo.description);
      expect(response.avatar_url).toBe(courseInfo.avatar_url);
      expect(response.currency).toBe(courseInfo.currency);
      expect(response.domains).toContain(DomainType.ENGLISH);
      expect(response.level).toBe(courseInfo.level);
      expect(response.price).toBe(courseInfo.price);
      expect(response.id).toBeDefined();

      const instructor = await getInstructor(instructorInfo.email);
      expect(instructor.created_courses[0].id).toBe(response.id);
      expect(instructor.created_courses[0].organization.id).toBe(
        organization.id,
      );
    });

    it('throws NotFoundException if instructor does not exist', async () => {
      const { organization } = await setupData();

      await expect(
        instructorService.createCourse({
          email: 'nobody@test.com',
          courseInfo,
          organizationId: organization.id,
        }),
      ).rejects.toThrow(new NotFoundException('Instructor does not exist'));
    });

    it('throws NotFoundException if instructor does not belong to the organization', async () => {
      const { organization } = await setupData();

      const otherOrg = new Organization();
      otherOrg.name = 'Other Org';
      otherOrg.email = 'other@test.com';
      otherOrg.password = await HashHelper.encrypt('password');
      await organizationRepository.save(otherOrg);

      await expect(
        instructorService.createCourse({
          email: instructorInfo.email,
          courseInfo,
          organizationId: otherOrg.id,
        }),
      ).rejects.toThrow(
        new NotFoundException('Instructor does not belong to the organization'),
      );
    });
  });

  describe('addCourseVersion', () => {
    it('returns a new version with version_number 1 and PENDING status', async () => {
      const { organization } = await setupData();
      const course = await instructorService.createCourse({
        email: instructorInfo.email,
        courseInfo,
        organizationId: organization.id,
      });

      const response = await instructorService.addCourseVersion({
        email: instructorInfo.email,
        courseId: course.id,
      });

      expect(response.version_number).toBe(1);
      expect(response.status).toBe(VersionStatusType.PENDING);
      expect(response.id).toBeDefined();

      const instructor = await getInstructor(instructorInfo.email);
      expect(instructor.created_courses[0].versions[0].id).toBe(response.id);
    });

    it('throws NotFoundException if instructor does not exist', async () => {
      const { organization } = await setupData();
      const course = await instructorService.createCourse({
        email: instructorInfo.email,
        courseInfo,
        organizationId: organization.id,
      });

      await expect(
        instructorService.addCourseVersion({
          email: 'nobody@test.com',
          courseId: course.id,
        }),
      ).rejects.toThrow(new NotFoundException('Instructor does not exist'));
    });

    it('throws NotFoundException if course does not exist', async () => {
      await setupData();

      await expect(
        instructorService.addCourseVersion({
          email: instructorInfo.email,
          courseId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(new NotFoundException('Course not found'));
    });
  });

  describe('addQuestionsToCourseVersion', () => {
    it('returns version with created questions and test suite', async () => {
      const { course, version } = await setupCourseWithVersion();

      const response = await instructorService.addQuestionsToCourseVersion({
        email: instructorInfo.email,
        versionId: version.id,
        suiteTitle: 'Suite One',
        suiteDescription: 'Suite description',
        suiteKeywords: ['algebra'],
        questions: sampleQuestions,
      });

      expect(response.questions).toHaveLength(2);

      const instructor = await getInstructor(instructorInfo.email);
      const savedQuestions =
        instructor.created_courses[0].versions[0].questions;
      expect(savedQuestions).toHaveLength(2);
      expect(
        savedQuestions.sort((a, b) => a.question_number - b.question_number)[0]
          .description,
      ).toBe('Heyyaaa test question 1.');
    });

    it('throws NotFoundException if instructor does not exist', async () => {
      const { version } = await setupCourseWithVersion();

      await expect(
        instructorService.addQuestionsToCourseVersion({
          email: 'nobody@test.com',
          versionId: version.id,
          suiteTitle: 'Suite',
          suiteDescription: 'Desc',
          suiteKeywords: [],
          questions: sampleQuestions,
        }),
      ).rejects.toThrow(new NotFoundException('Instructor does not exist'));
    });

    it('throws NotFoundException if course version does not exist', async () => {
      await setupData();

      await expect(
        instructorService.addQuestionsToCourseVersion({
          email: instructorInfo.email,
          versionId: '00000000-0000-0000-0000-000000000000',
          suiteTitle: 'Suite',
          suiteDescription: 'Desc',
          suiteKeywords: [],
          questions: sampleQuestions,
        }),
      ).rejects.toThrow(new NotFoundException('Course version not found'));
    });
  });

  describe('updateQuestion', () => {
    it('updates and returns the question with new values', async () => {
      const { version } = await setupCourseWithVersion();
      await instructorService.addQuestionsToCourseVersion({
        email: instructorInfo.email,
        versionId: version.id,
        suiteTitle: 'Suite One',
        suiteDescription: 'Desc',
        suiteKeywords: [],
        questions: sampleQuestions,
      });

      const instructor = await getInstructor(instructorInfo.email);
      const questionId =
        instructor.created_courses[0].versions[0].questions[0].id;

      const updated = await instructorService.updateQuestion({
        email: instructorInfo.email,
        questionId,
        question: {
          ...sampleQuestions[0],
          description: 'Updated description',
          correct_answer: 'option two',
        },
      });

      expect(updated.description).toBe('Updated description');
      expect(updated.correct_answer).toBe('option two');
    });

    it('throws NotFoundException if instructor does not exist', async () => {
      const { version } = await setupCourseWithVersion();
      await instructorService.addQuestionsToCourseVersion({
        email: instructorInfo.email,
        versionId: version.id,
        suiteTitle: 'Suite',
        suiteDescription: 'Desc',
        suiteKeywords: [],
        questions: sampleQuestions,
      });

      const instructor = await getInstructor(instructorInfo.email);
      const questionId =
        instructor.created_courses[0].versions[0].questions[0].id;

      await expect(
        instructorService.updateQuestion({
          email: 'nobody@test.com',
          questionId,
          question: sampleQuestions[0],
        }),
      ).rejects.toThrow(new NotFoundException('Instructor does not exist'));
    });

    it('throws NotFoundException if question does not exist', async () => {
      await setupData();

      await expect(
        instructorService.updateQuestion({
          email: instructorInfo.email,
          questionId: '00000000-0000-0000-0000-000000000000',
          question: sampleQuestions[0],
        }),
      ).rejects.toThrow(new NotFoundException('Question not found'));
    });
  });

  describe('requestCourseVersionReview', () => {
    it('returns the review request linked to the version and organization', async () => {
      const { organization, version } = await setupCourseWithVersion();
      await instructorService.addQuestionsToCourseVersion({
        email: instructorInfo.email,
        versionId: version.id,
        suiteTitle: 'Suite',
        suiteDescription: 'Desc',
        suiteKeywords: [],
        questions: sampleQuestions,
      });

      const response = await instructorService.requestCourseVersionReview({
        email: instructorInfo.email,
        versionId: version.id,
      });

      expect(response.course_version.id).toBe(version.id);

      const instructor = await getInstructor(instructorInfo.email);
      const reviewRequest =
        instructor.created_courses[0].versions[0].review_request;
      expect(reviewRequest.id).toBe(response.id);
      expect(reviewRequest.organization.id).toBe(organization.id);
      expect(reviewRequest.course_version.id).toBe(version.id);
    });

    it('throws NotFoundException if instructor does not exist', async () => {
      const { version } = await setupCourseWithVersion();

      await expect(
        instructorService.requestCourseVersionReview({
          email: 'nobody@test.com',
          versionId: version.id,
        }),
      ).rejects.toThrow(new NotFoundException('Instructor does not exist'));
    });

    it('throws NotFoundException if course version does not exist', async () => {
      await setupData();

      await expect(
        instructorService.requestCourseVersionReview({
          email: instructorInfo.email,
          versionId: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(new NotFoundException('Course version not found'));
    });
  });
});
