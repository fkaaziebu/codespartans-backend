import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Cart,
  Category,
  Course,
  entities,
  Instructor,
  Organization,
  SchoolStudent,
  Student,
  Version,
} from '../../../database/entities';
import {
  CurrencyType,
  DomainType,
  LevelType,
} from '../../inventory/entities/course.entity';
import { ClassLevel } from '../../parent/entities/child.entity';
import { HashHelper } from '../../../helpers';
import { SchoolService } from './school.service';

describe('SchoolService', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let schoolService: SchoolService;

  let organizationRepository: Repository<Organization>;
  let categoryRepository: Repository<Category>;
  let courseRepository: Repository<Course>;
  let versionRepository: Repository<Version>;
  let instructorRepository: Repository<Instructor>;
  let cartRepository: Repository<Cart>;
  let studentRepository: Repository<Student>;
  let schoolStudentRepository: Repository<SchoolStudent>;

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
      providers: [SchoolService],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    schoolService = module.get<SchoolService>(SchoolService);
    organizationRepository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    categoryRepository = module.get<Repository<Category>>(getRepositoryToken(Category));
    courseRepository = module.get<Repository<Course>>(getRepositoryToken(Course));
    versionRepository = module.get<Repository<Version>>(getRepositoryToken(Version));
    instructorRepository = module.get<Repository<Instructor>>(getRepositoryToken(Instructor));
    cartRepository = module.get<Repository<Cart>>(getRepositoryToken(Cart));
    studentRepository = module.get<Repository<Student>>(getRepositoryToken(Student));
    schoolStudentRepository = module.get<Repository<SchoolStudent>>(getRepositoryToken(SchoolStudent));
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

  const orgInfo = { name: 'Test School', email: 'school@test.com', password: 'password' };

  const setupOrg = async () => {
    const org = new Organization();
    org.name = orgInfo.name;
    org.email = orgInfo.email;
    org.password = await HashHelper.encrypt(orgInfo.password);
    return organizationRepository.save(org);
  };

  const setupCategory = async (org: Organization) => {
    const instructor = new Instructor();
    instructor.name = 'Test Instructor';
    instructor.email = `instr-${Date.now()}@test.com`;
    instructor.password = await HashHelper.encrypt('password');
    instructor.organizations = [org];
    await instructorRepository.save(instructor);

    const course = new Course();
    course.title = 'Maths';
    course.description = 'Maths course';
    course.avatar_url = 'https://example.com/img.jpg';
    course.currency = CurrencyType.USD;
    course.domains = [DomainType.ENGLISH];
    course.level = LevelType.BEGINNER;
    course.price = 0;
    course.organization = org;
    course.instructor = instructor;
    await courseRepository.save(course);

    const version = new Version();
    version.version_number = 1;
    version.course = course;
    await versionRepository.save(version);

    course.approved_version = version;
    await courseRepository.save(course);

    const category = new Category();
    category.name = 'BECE';
    category.avatar_url = 'https://example.com/cat.jpg';
    category.organization = org;
    category.courses = [course];
    await categoryRepository.save(category);

    return { category, course };
  };

  const enrollStudent = async (org: Organization, category: Category) => {
    return schoolService.addSchoolStudent(org.email, {
      full_name: 'Alice Student',
      class_level: ClassLevel.JHS1,
      target_exam: category.id,
    });
  };

  // ─── addSchoolStudent ────────────────────────────────────────────────────────

  describe('addSchoolStudent', () => {
    it('creates a school student and returns credentials', async () => {
      const org = await setupOrg();
      const { category } = await setupCategory(org);

      const result = await enrollStudent(org, category);

      expect(result.message).toBe('Student enrolled successfully');
      expect(result.pin).toBeDefined();
      expect(result.pin).toHaveLength(6);

      const ss = await schoolStudentRepository.findOne({
        where: { full_name: 'Alice Student' },
        relations: ['student'],
      });
      expect(ss).toBeDefined();
      expect(ss.student).toBeDefined();
      expect(ss.student.is_account_validated).toBe(true);
      expect(ss.student.is_setup_completed).toBe(true);
    });

    it('throws NotFoundException if organization does not exist', async () => {
      await expect(
        schoolService.addSchoolStudent('nobody@test.com', {
          full_name: 'Bob',
          class_level: ClassLevel.JHS1,
          target_exam: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(new NotFoundException('Organization not found'));
    });

    it('throws NotFoundException if category does not exist', async () => {
      const org = await setupOrg();

      await expect(
        schoolService.addSchoolStudent(org.email, {
          full_name: 'Bob',
          class_level: ClassLevel.JHS1,
          target_exam: '00000000-0000-0000-0000-000000000000',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── bulkEnrollStudents ──────────────────────────────────────────────────────

  describe('bulkEnrollStudents', () => {
    it('enrolls multiple students and returns credentials for each', async () => {
      const org = await setupOrg();
      const { category } = await setupCategory(org);

      const results = await schoolService.bulkEnrollStudents(org.email, [
        { full_name: 'Alice A', class_level: ClassLevel.JHS1, target_exam: category.id },
        { full_name: 'Bob B', class_level: ClassLevel.SHS1, target_exam: category.id },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].full_name).toBe('Alice A');
      expect(results[1].full_name).toBe('Bob B');
      results.forEach((r) => {
        expect(r.username).toBeDefined();
        expect(r.pin).toHaveLength(6);
      });

      const count = await schoolStudentRepository.count();
      expect(count).toBe(2);
    });

    it('throws NotFoundException if organization does not exist', async () => {
      await expect(
        schoolService.bulkEnrollStudents('nobody@test.com', []),
      ).rejects.toThrow(new NotFoundException('Organization not found'));
    });
  });

  // ─── listSchoolStudents ──────────────────────────────────────────────────────

  describe('listSchoolStudents', () => {
    it('returns paginated students for the organization', async () => {
      const org = await setupOrg();
      const { category } = await setupCategory(org);
      await enrollStudent(org, category);

      const result = await schoolService.listSchoolStudents(org.email);

      expect(result.edges).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    it('filters by searchTerm', async () => {
      const org = await setupOrg();
      const { category } = await setupCategory(org);
      await enrollStudent(org, category);

      const match = await schoolService.listSchoolStudents(org.email, 'Alice');
      expect(match.edges).toHaveLength(1);

      const empty = await schoolService.listSchoolStudents(org.email, 'NonExistent');
      expect(empty.edges).toHaveLength(0);
    });

    it('throws NotFoundException if organization does not exist', async () => {
      await expect(
        schoolService.listSchoolStudents('nobody@test.com'),
      ).rejects.toThrow(new NotFoundException('Organization not found'));
    });
  });

  // ─── resetStudentPin ─────────────────────────────────────────────────────────

  describe('resetStudentPin', () => {
    it('resets the pin and returns a new one', async () => {
      const org = await setupOrg();
      const { category } = await setupCategory(org);
      await enrollStudent(org, category);

      const ss = await schoolStudentRepository.findOne({
        where: { full_name: 'Alice Student' },
      });
      const oldPin = ss.pin;

      const result = await schoolService.resetStudentPin(org.email, ss.id);

      expect(result.message).toBe('PIN reset successfully');
      expect(result.pin).toHaveLength(6);

      const updated = await schoolStudentRepository.findOne({ where: { id: ss.id } });
      expect(updated.pin).not.toBe(oldPin);
    });

    it('throws NotFoundException if student does not exist', async () => {
      const org = await setupOrg();

      await expect(
        schoolService.resetStudentPin(org.email, '00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  // ─── shareStudentLogin ───────────────────────────────────────────────────────

  describe('shareStudentLogin', () => {
    it('returns a message containing the student username', async () => {
      const org = await setupOrg();
      const { category } = await setupCategory(org);
      await enrollStudent(org, category);

      const ss = await schoolStudentRepository.findOne({
        where: { full_name: 'Alice Student' },
      });

      const result = await schoolService.shareStudentLogin(org.email, ss.id);

      expect(result.message).toContain(ss.username);
      expect(result.message).toContain('Alice Student');
    });

    it('throws NotFoundException if student does not exist', async () => {
      const org = await setupOrg();

      await expect(
        schoolService.shareStudentLogin(org.email, '00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  // ─── removeSchoolStudent ─────────────────────────────────────────────────────

  describe('removeSchoolStudent', () => {
    it('removes the student and returns success message', async () => {
      const org = await setupOrg();
      const { category } = await setupCategory(org);
      await enrollStudent(org, category);

      const ss = await schoolStudentRepository.findOne({
        where: { full_name: 'Alice Student' },
      });

      const result = await schoolService.removeSchoolStudent(org.email, ss.id);

      expect(result.message).toBe('Student removed from school successfully');

      const deleted = await schoolStudentRepository.findOne({ where: { id: ss.id } });
      expect(deleted).toBeNull();
    });

    it('throws NotFoundException if student does not exist', async () => {
      const org = await setupOrg();

      await expect(
        schoolService.removeSchoolStudent(org.email, '00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  // ─── verifyStudentUsername ───────────────────────────────────────────────────

  describe('verifyStudentUsername', () => {
    it('returns a temp_token for a known username', async () => {
      const org = await setupOrg();
      const { category } = await setupCategory(org);
      await enrollStudent(org, category);

      const ss = await schoolStudentRepository.findOne({
        where: { full_name: 'Alice Student' },
      });

      const result = await schoolService.verifyStudentUsername(ss.username);

      expect(result.temp_token).toBeDefined();
    });

    it('throws NotFoundException for an unknown username', async () => {
      await expect(
        schoolService.verifyStudentUsername('unknown.user99'),
      ).rejects.toThrow(new NotFoundException('Username not found'));
    });
  });

  // ─── loginSchoolStudent ──────────────────────────────────────────────────────

  describe('loginSchoolStudent', () => {
    it('returns student with token and refresh_token after valid pin', async () => {
      const org = await setupOrg();
      const { category } = await setupCategory(org);
      const { pin } = await enrollStudent(org, category);

      const ss = await schoolStudentRepository.findOne({
        where: { full_name: 'Alice Student' },
      });

      const { temp_token } = await schoolService.verifyStudentUsername(ss.username);
      const response = await schoolService.loginSchoolStudent(temp_token, pin);

      expect(response.token).toBeDefined();
      expect(response.refresh_token).toBeDefined();
    });

    it('throws UnauthorizedException for an invalid temp_token', async () => {
      await expect(
        schoolService.loginSchoolStudent('bad.token', '123456'),
      ).rejects.toThrow(new UnauthorizedException('Invalid or expired token'));
    });

    it('throws BadRequestException for a wrong pin', async () => {
      const org = await setupOrg();
      const { category } = await setupCategory(org);
      await enrollStudent(org, category);

      const ss = await schoolStudentRepository.findOne({
        where: { full_name: 'Alice Student' },
      });

      const { temp_token } = await schoolService.verifyStudentUsername(ss.username);

      await expect(
        schoolService.loginSchoolStudent(temp_token, '000000'),
      ).rejects.toThrow(new BadRequestException('Invalid PIN'));
    });

    it('throws UnauthorizedException if token type is not temp', async () => {
      const org = await setupOrg();
      const { category } = await setupCategory(org);
      const { pin } = await enrollStudent(org, category);

      const ss = await schoolStudentRepository.findOne({
        where: { full_name: 'Alice Student' },
      });

      // Get a real token, then use it with loginSchoolStudent (type mismatch)
      const { temp_token } = await schoolService.verifyStudentUsername(ss.username);

      // First login succeeds to get a long-lived token
      const loginResponse = await schoolService.loginSchoolStudent(temp_token, pin);

      await expect(
        schoolService.loginSchoolStudent(loginResponse.token, pin),
      ).rejects.toThrow(new UnauthorizedException('Invalid token type'));
    });
  });
});
