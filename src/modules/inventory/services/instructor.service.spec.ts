import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import {
  Admin,
  entities,
  Instructor,
  Organization,
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
import { VersionStatusType } from '../../../database/types/version.type';
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

  describe('createCourse', () => {
    it('returns created course after successfully creating course', async () => {
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
      expect(instructor?.created_courses[0].id).toEqual(response.id);
      expect(instructor?.created_courses[0].organization.id).toEqual(
        organization.id,
      );
    });
  });

  describe('addCourseVersion', () => {
    it('returns course version after creation', async () => {
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

      expect(response.version_number).toEqual(1);
      expect(response.status).toBe(VersionStatusType.PENDING);
      expect(response.id).toBeDefined();

      const instructor = await getInstructor(instructorInfo.email);

      expect(instructor?.created_courses[0].versions[0].id).toEqual(
        response.id,
      );
      expect(instructor?.created_courses[0].versions[0].version_number).toEqual(
        1,
      );
      expect(instructor?.created_courses[0].versions[0].status).toBe(
        VersionStatusType.PENDING,
      );
    });
  });

  describe('addQuestionsToCourseVersion', () => {
    it('returns version with questions', async () => {
      const { organization } = await setupData();

      const course = await instructorService.createCourse({
        email: instructorInfo.email,
        courseInfo,
        organizationId: organization.id,
      });

      const courseVersion = await instructorService.addCourseVersion({
        email: instructorInfo.email,
        courseId: course.id,
      });

      const response = await instructorService.addQuestionsToCourseVersion({
        email: instructorInfo.email,
        versionId: courseVersion.id,
        questions: instructorInfo.questions,
      });

      expect(response.questions).toHaveLength(2);

      const instructor = await getInstructor(instructorInfo.email);

      expect(instructor?.created_courses[0].versions[0].questions).toHaveLength(
        2,
      );

      expect(
        instructor?.created_courses[0].versions[0].questions.sort(
          (a, b) => a.question_number - b.question_number,
        )[0].description,
      ).toBe('Heyyaaa test question 1.');
    });
  });

  describe('requestCourseVersionReview', () => {
    it('returns review_request after request', async () => {
      const { organization } = await setupData();

      const course = await instructorService.createCourse({
        email: instructorInfo.email,
        courseInfo,
        organizationId: organization.id,
      });

      const courseVersion = await instructorService.addCourseVersion({
        email: instructorInfo.email,
        courseId: course.id,
      });

      await instructorService.addQuestionsToCourseVersion({
        email: instructorInfo.email,
        versionId: courseVersion.id,
        questions: instructorInfo.questions,
      });

      const response = await instructorService.requestCourseVersionReview({
        email: instructorInfo.email,
        versionId: courseVersion.id,
      });

      expect(response.course_version.id).toBe(courseVersion.id);

      const instructor = await getInstructor(instructorInfo.email);

      expect(instructor?.created_courses[0].versions[0].review_request.id).toBe(
        response.id,
      );

      expect(
        instructor?.created_courses[0].versions[0].review_request.organization
          .id,
      ).toBe(organization.id);

      expect(
        instructor?.created_courses[0].versions[0].review_request.course_version
          .id,
      ).toBe(courseVersion.id);
    });
  });

  const instructorInfo: { email: string; questions: QuestionInput[] } = {
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

  const courseInfo: CourseInfoInput = {
    avatar_url: 'https://example.com/avatar.jpg',
    currency: CurrencyType.USD,
    description: 'This is a test course',
    domains: [DomainType.ENGLISH],
    level: LevelType.BEGINNER,
    price: 100,
    title: 'Test Course',
  };

  const getInstructor = async (email: string) => {
    return await instructorRepository.findOne({
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

    return { organization, admin, instructor };
  };
});
