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
import {
  PlanInterval,
  SubscriptionPlan,
} from './modules/demo/entities/subscription-plan.entity';
import { HashHelper } from './helpers';
import datas from './data/setup';

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

      const subjectImageFiles: Record<
        string,
        { filename: string; mime: string; ext: string }
      > = {
        Mathematics: { filename: 'math_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        'English Language': { filename: 'english_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        Physics: { filename: 'physics_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        Chemistry: { filename: 'chemistry_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        Biology: { filename: 'biology_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        Economics: { filename: 'economics_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        Geography: { filename: 'geography_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        Literature: { filename: 'literature_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        Government: { filename: 'government_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        History: { filename: 'history_1.png', mime: 'image/png', ext: 'png' },
        'Social Studies': { filename: 'social_studies_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        'Integrated Science': { filename: 'integrated_science_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        'Religious and Moral Education': { filename: 'religious_moral_education_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
        ICT: { filename: 'ict_1.jpeg', mime: 'image/jpeg', ext: 'jpeg' },
      };

      const subjectImageUrls: Record<string, string> = {};
      for (const [subject, { filename, mime, ext }] of Object.entries(subjectImageFiles)) {
        const img = new Image();
        img.path = `seed-${subject.toLowerCase().replace(/\s+/g, '-')}-question.${ext}`;
        img.original_name = filename;
        img.mime_type = mime;
        img.buffer = fs.readFileSync(
          path.resolve(path.join(__dirname, '/data/', filename)),
        );
        await this.imageRepository.save(img);
        subjectImageUrls[subject] = `${studentUrl}/api/images/${img.path}`;
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

          // Each suite gets its own dedicated version so suites can be
          // versioned, reviewed, and updated independently.
          let firstVersion: Version | null = null;

          for (const suiteData of courseData.suites) {
            const version = new Version();
            version.status = VersionStatusType.APPROVED;
            version.version_number = 1;
            version.course = course;
            version.assigned_admin = admin;
            await this.versionRepository.save(version);

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

            if (!firstVersion) firstVersion = version;
          }

          // Mark the first suite's version as the course's approved version.
          if (firstVersion) {
            course.approved_version = firstVersion;
            await this.courseRepository.save(course);
          }

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
    const plans = [
      {
        plan_key: 'student_free',
        name: 'Student Free',
        tagline: 'Individual learners getting started',
        price: 0,
        currency: 'GHS',
        interval: PlanInterval.MONTHLY,
        duration_days: 30,
        is_custom: false,
        billing_label: null,
        max_students: null,
        features: [
          '1 subject access',
          '10 questions/day',
          'Basic progress dashboard',
          'Mobile app access',
        ],
      },
      {
        plan_key: 'student_pro',
        name: 'Student Pro',
        tagline: 'Serious WASSCE/BECE candidates',
        price: 39,
        currency: 'GHS',
        interval: PlanInterval.MONTHLY,
        duration_days: 30,
        is_custom: false,
        billing_label: 'per student / month',
        max_students: null,
        features: [
          'All subjects unlocked',
          'Unlimited practice questions',
          'Weak area analysis',
          'Timed exam simulation',
          'Answer explanations',
          'Parent visibility included',
        ],
      },
      {
        plan_key: 'institution',
        name: 'Institution',
        tagline: 'Schools, SHS, tutorial centers',
        price: 499,
        currency: 'GHS',
        interval: PlanInterval.MONTHLY,
        duration_days: 30,
        is_custom: false,
        billing_label: 'per month · up to 100 students',
        max_students: 100,
        features: [
          'Everything in Student Pro',
          'Admin & teacher console',
          'Class performance analytics',
          'Monthly PDF reports',
          'Branded school portal',
          'Priority WhatsApp support',
          'Founding rate locked in for 12 months',
        ],
      },
      {
        plan_key: 'enterprise',
        name: 'Enterprise',
        tagline: '500+ students, multi-campus',
        price: 0,
        currency: 'GHS',
        interval: PlanInterval.MONTHLY,
        duration_days: 30,
        is_custom: true,
        billing_label: 'tailored to your institution',
        max_students: null,
        features: [
          'Everything in Institution',
          'Unlimited student accounts',
          'Multi-campus management',
          'Dedicated account manager',
          'Custom integrations available',
          'SLA and uptime guarantee',
        ],
      },
      {
        plan_key: 'school_trial',
        name: 'School Free Trial',
        tagline: 'Trial access for schools',
        price: 0,
        currency: 'GHS',
        interval: PlanInterval.MONTHLY,
        duration_days: 30,
        is_custom: false,
        billing_label: null,
        max_students: null,
        features: [
          'All subjects unlocked',
          'Admin & teacher console',
          'Class performance analytics',
        ],
      },
      {
        plan_key: 'parent_trial',
        name: 'Parent Free Trial',
        tagline: 'Trial access for parents',
        price: 0,
        currency: 'GHS',
        interval: PlanInterval.MONTHLY,
        duration_days: 30,
        is_custom: false,
        billing_label: null,
        max_students: null,
        features: [
          'All subjects unlocked',
          'Unlimited practice questions',
          'Weak area analysis',
          'Timed exam simulation',
        ],
      },
      {
        plan_key: 'parent_1mo',
        name: '1 Month',
        tagline: 'Full access for 1 month',
        price: 90,
        currency: 'GHS',
        interval: PlanInterval.MONTHLY,
        duration_days: 30,
        is_custom: false,
        billing_label: null,
        max_students: null,
        features: [
          'All subjects unlocked',
          'Unlimited practice questions',
          'Weak area analysis',
          'Timed exam simulation',
          'Answer explanations',
        ],
      },
      {
        plan_key: 'parent_2mo',
        name: '2 Months',
        tagline: 'Full access for 2 months',
        price: 180,
        currency: 'GHS',
        interval: PlanInterval.MONTHLY,
        duration_days: 60,
        is_custom: false,
        billing_label: null,
        max_students: null,
        features: [
          'All subjects unlocked',
          'Unlimited practice questions',
          'Weak area analysis',
          'Timed exam simulation',
          'Answer explanations',
        ],
      },
      {
        plan_key: 'parent_3mo',
        name: '3 Months',
        tagline: 'Best for exam season',
        price: 243,
        currency: 'GHS',
        interval: PlanInterval.QUARTERLY,
        duration_days: 90,
        is_custom: false,
        billing_label: 'Popular',
        max_students: null,
        features: [
          'All subjects unlocked',
          'Unlimited practice questions',
          'Weak area analysis',
          'Timed exam simulation',
          'Answer explanations',
          '10% savings vs monthly',
        ],
      },
      {
        plan_key: 'parent_1yr',
        name: '1 Year',
        tagline: 'Maximum savings for dedicated learners',
        price: 900,
        currency: 'GHS',
        interval: PlanInterval.YEARLY,
        duration_days: 365,
        is_custom: false,
        billing_label: 'Best value',
        max_students: null,
        features: [
          'All subjects unlocked',
          'Unlimited practice questions',
          'Weak area analysis',
          'Timed exam simulation',
          'Answer explanations',
          '17% savings vs monthly',
        ],
      },
    ];

    for (const planData of plans) {
      const existing = await this.planRepository.findOne({
        where: { plan_key: planData.plan_key },
      });
      if (!existing) {
        const plan = this.planRepository.create(planData);
        await this.planRepository.save(plan);
      }
    }
  }
}
