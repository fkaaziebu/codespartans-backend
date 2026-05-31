import * as fs from 'fs';
import * as path from 'path';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Admin } from './modules/auth/entities/admin.entity';
import { Instructor } from './modules/auth/entities/instructor.entity';
import { Organization } from './modules/auth/entities/organization.entity';
import { Cart } from './modules/inventory/entities/cart.entity';
import { Category } from './modules/inventory/entities/category.entity';
import { Image } from './modules/media/entities/image.entity';
import {
  Course,
  CurrencyType,
  DomainType,
  LevelType,
} from './modules/inventory/entities/course.entity';
import {
  Question,
  QuestionClassLevel,
  QuestionDifficultyType,
  QuestionTagType,
  QuestionType,
} from './modules/review/entities/question.entity';
import {
  TestSuite,
  SuiteType,
} from './modules/review/entities/test_suite.entity';
import {
  Version,
  VersionStatusType,
} from './modules/review/entities/version.entity';
import { SubscriptionPlan } from './modules/demo/entities/subscription-plan.entity';
import { HashHelper } from './helpers';
import datas, { plans } from './data/setup';

@Injectable()
export class SetupDbService implements OnModuleInit {
  private readonly logger = new Logger(SetupDbService.name);

  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Instructor)
    private instructorRepository: Repository<Instructor>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Version)
    private versionRepository: Repository<Version>,
    @InjectRepository(TestSuite)
    private testSuiteRepository: Repository<TestSuite>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.logger.log('Running database setup on startup...');
    await this.setupDatabase();
  }

  async setupDatabase() {
    try {
      const organization = new Organization();
      organization.name = 'Kwame Nkrumah Senior High School';
      organization.email = this.configService.get<string>('GENPOP_EMAIL');
      organization.password = await HashHelper.encrypt('password');
      await this.organizationRepository.save(organization);

      const instructor = new Instructor();
      instructor.name = 'Johnson Ameyaw';
      instructor.email = 'johnsonameyaw@gmail.com';
      instructor.password = await HashHelper.encrypt('password');
      instructor.organizations = [organization];
      await this.instructorRepository.save(instructor);

      const admin = new Admin();
      admin.name = 'Stephen Grider';
      admin.email = 'stephengrider@gmail.com';
      admin.password = await HashHelper.encrypt('password');
      admin.organization = organization;
      await this.adminRepository.save(admin);

      const cart = new Cart();
      await this.cartRepository.save(cart);

      const studentUrl = this.configService.get<string>('STUDENT_URL');

      const subjectImageUrls: Record<string, string> = {};
      const seenImages = new Set<string>();
      for (const categoryData of datas) {
        for (const courseData of categoryData.courses) {
          if (seenImages.has(courseData.courseName)) continue;
          seenImages.add(courseData.courseName);
          const { filename, mime, ext } = courseData.imageFile;
          const img = new Image();
          img.path = `seed-${courseData.courseName.toLowerCase().replace(/\s+/g, '-')}-question.${ext}`;
          img.original_name = filename;
          img.mime_type = mime;
          img.buffer = fs.readFileSync(
            path.resolve(path.join(__dirname, '/data/', filename)),
          );
          await this.imageRepository.save(img);
          subjectImageUrls[courseData.courseName] = `${studentUrl}/api/images/${img.path}`;
        }
      }

      // Build a deduplicated course map so that courses shared across categories
      // (e.g. General Study reuses WASSCE + BECE courses) are only created once.
      const courseMap = new Map<string, Course>();

      for (const categoryData of datas) {
        for (const courseData of categoryData.courses) {
          if (courseMap.has(courseData.courseName)) continue;

          const course = new Course();
          course.title = courseData.courseName;
          course.description = `${courseData.courseName} exam preparation course`;
          course.avatar_url =
            subjectImageUrls[courseData.courseName] ||
            subjectImageUrls['Mathematics'];
          course.currency = CurrencyType.USD;
          course.domains = [DomainType.ENGLISH];
          course.level = LevelType.BEGINNER;
          course.price = 100;
          course.is_mandatory = courseData.is_mandatory;
          course.instructor = instructor;
          course.organization = organization;
          await this.courseRepository.save(course);

          const version = new Version();
          version.status = VersionStatusType.APPROVED;
          version.version_number = 1;
          version.course = course;
          version.assigned_admin = admin;
          await this.versionRepository.save(version);

          for (const suiteData of courseData.suites) {
            const suite = new TestSuite();
            suite.title = suiteData.suiteName;
            suite.description = suiteData.suiteDescription;
            suite.keywords = suiteData.suiteKeywords;
            suite.suite_type =
              ('suiteType' in suiteData
                ? (suiteData.suiteType as SuiteType)
                : null) ?? SuiteType.YEAR;
            suite.image_url =
              subjectImageUrls[courseData.courseName] ||
              subjectImageUrls['Mathematics'];
            suite.course_version = version;
            await this.testSuiteRepository.save(suite);

            const questions: Question[] = suiteData.questions.map((q) => {
              const question = new Question();
              question.question_number = q.question_number;
              question.description = q.description.replace(
                '/v1/images/seed-sample-question.png',
                subjectImageUrls[courseData.courseName] ||
                  subjectImageUrls['Mathematics'],
              );
              question.hints = q.hints;
              question.solution_steps = q.solution_steps;
              question.options = q.options;
              question.type = q.type as QuestionType;
              question.tags = q.tags as QuestionTagType[];
              question.difficulty = q.difficulty as QuestionDifficultyType;
              question.estimated_time_in_ms = q.estimated_time_in_ms;
              question.class_level = q.class_level as QuestionClassLevel;
              question.exam_year = q.exam_year;
              question.correct_answer = q.correct_answer;
              if (q.marks !== undefined) question.marks = q.marks;
              question.version = version;
              question.test_suite = suite;
              return question;
            });
            await this.questionRepository.save(questions);
          }

          course.approved_version = version;
          await this.courseRepository.save(course);

          courseMap.set(courseData.courseName, course);
        }
      }

      // Create categories and attach the corresponding courses.
      for (const categoryData of datas) {
        const courses = categoryData.courses
          .map((c) => courseMap.get(c.courseName))
          .filter((c): c is Course => c !== undefined);

        const category = new Category();
        category.name = categoryData.categoryName;
        category.avatar_url = 'https://example.com/avatar.jpg';
        category.organization = organization;
        category.courses = courses;
        await this.categoryRepository.save(category);
      }

      await this.setupSubscriptionPlans();
      this.logger.log('Database setup complete.');
    } catch (err) {
      this.logger.error('Database setup failed', err);
    }
  }

  private async setupSubscriptionPlans() {
    for (const planData of plans) {
      const existing = await this.planRepository.findOne({
        where: { plan_key: planData.plan_key },
      });
      if (!existing) {
        const plan = this.planRepository.create(planData as any);
        await this.planRepository.save(plan);
      }
    }
  }
}
