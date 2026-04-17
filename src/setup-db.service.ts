import { Repository } from 'typeorm';
import {
  Admin,
  Cart,
  Category,
  Course,
  Instructor,
  Organization,
  Question,
  Student,
  TestSuite,
  Version,
} from './database/entities';
import { HashHelper } from './helpers';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import {
  CurrencyType,
  DomainType,
  LevelType,
} from './database/types/course.type';
import { QuestionInput } from './modules/inventory/inputs';
import {
  QuestionDifficultyType,
  QuestionTagType,
  QuestionType,
} from './database/types/question.type';
import { VersionStatusType } from './database/types/version.type';

@Injectable()
export class SetupDbService {
  constructor(
    @InjectRepository(Instructor)
    private instructorRepository: Repository<Instructor>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Version)
    private versionRepository: Repository<Version>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(TestSuite)
    private testSuiteRepository: Repository<TestSuite>,
  ) {}

  async setupDatabase() {
    try {
      /** Step One
       * (1) Create Organization with genpop email (knust@st.edu.gh)
       * (2) Create an instructor and an admin for the genpop organization
       * (3) Create a student under the organization
       */
      const organization = new Organization();
      organization.name = 'Kwame Nkrumah Senior High School';
      organization.email = 'knust@st.edu.gh';
      organization.password = await HashHelper.encrypt('password');

      await this.organizationRepository.save(organization);

      const instructor = new Instructor();
      instructor.name = 'Johnson Ameyaw';
      instructor.email = 'johnsonameyaw@gmail.com';
      instructor.password = await HashHelper.encrypt('password');
      instructor.organizations = [organization];

      await this.instructorRepository.save(instructor);

      const admin = new Admin();
      admin.name = 'stephen grider';
      admin.email = 'stephengrider@gmail.com';
      admin.password = await HashHelper.encrypt('password');
      admin.organization = organization;

      await this.adminRepository.save(admin);

      const cart = new Cart();

      await this.cartRepository.save(cart);

      const student = new Student();
      student.name = 'Frederick Aziebu';
      student.email = 'frederickaziebu1998@gmail.com';
      student.password = await HashHelper.encrypt('password');
      student.cart = cart;
      student.organizations = [organization];

      await this.studentRepository.save(student);

      /** Step Two
       * (1) Instructor should create a course
       * (2) Attach questions to course
       * (3) Request course review
       * (4) Organization should assign course to admin
       * (5) Admin should approve course
       */
      // create course
      const wassce_courses = [
        'Mathematics',
        'English Language',
        'Physics',
        'Chemistry',
        'Biology',
        'Economics',
        'Geography',
        'Literature',
        'Government',
        'History',
      ];

      const new_wassce_courses: Course[] = await Promise.all(
        wassce_courses.map(async (course_name) => {
          const wassce_course = new Course();
          wassce_course.avatar_url = 'https://example.com/avatar.jpg';
          wassce_course.currency = CurrencyType.USD;
          wassce_course.description = 'This is a test course';
          wassce_course.domains = [DomainType.ENGLISH];
          wassce_course.level = LevelType.BEGINNER;
          wassce_course.price = 100;
          wassce_course.title = course_name;
          wassce_course.instructor = instructor;
          wassce_course.organization = organization;

          return wassce_course;
        }),
      );

      await this.courseRepository.save(new_wassce_courses);

      // create course versions
      const new_wassce_course_versions: Version[] = await Promise.all(
        new_wassce_courses.map(async (course) => {
          const version = new Version();
          version.status = VersionStatusType.APPROVED;
          version.version_number = 1;
          version.course = course;
          version.assigned_admin = admin;
          await this.versionRepository.save(version);

          course.approved_version = version;
          await this.courseRepository.save(course);

          return version;
        }),
      );

      // await this.versionRepository.save(new_wassce_course_versions);

      const new_wassce_course_version_questions: Question[][] =
        await Promise.all(
          new_wassce_course_versions.map(async (version) => {
            const new_suite = new TestSuite();
            new_suite.title = 'suiteTitle';
            new_suite.description = 'suiteDescription';
            new_suite.keywords = ['suiteKeywords'];
            new_suite.course_version = version;

            await this.testSuiteRepository.save(new_suite);

            // add questions to course version
            const questions: QuestionInput[] = [
              {
                question_number: 1,
                description: 'Heyyaaa test question 1.',
                hints: ['hint one', 'hint two', 'hint three'],
                solution_steps: ['step one', 'step two', 'step three'],
                options: [
                  'option one',
                  'option two',
                  'option three',
                  'option four',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_MATHEMATICS],
                difficulty: QuestionDifficultyType.EASY,
                estimated_time_in_ms: 10000,
                correct_answer: 'option one',
              },
              {
                question_number: 2,
                description: 'Heyyaaa test question 2.',
                hints: ['hint one', 'hint two', 'hint three'],
                solution_steps: ['step one', 'step two', 'step three'],
                options: [
                  'option one',
                  'option two',
                  'option three',
                  'option four',
                ],
                type: QuestionType.MULTIPLE_CHOICE,
                tags: [QuestionTagType.TAG_MATHEMATICS],
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
                new_question.estimated_time_in_ms =
                  question.estimated_time_in_ms;
                new_question.hints = question.hints;
                new_question.options = question.options;
                new_question.question_number = question.question_number;
                new_question.solution_steps = question.solution_steps;
                new_question.tags = question.tags;
                new_question.type = question.type;
                new_question.version = version;
                new_question.test_suite = new_suite;

                return new_question;
              }),
            );

            return new_questions;
          }),
        );

      await this.questionRepository.save(
        new_wassce_course_version_questions.flat(),
      );

      /** Step Three
       * (1) Admin should create a category
       * (2) Admin should add course to category
       */
      const categories = [
        'WAEC / WASSCE',
        'JAMB / UTME',
        'BECE',
        'SAT / A-Levels',
        'University Exams',
        'General Study',
      ];

      const new_categories: Category[] = await Promise.all(
        categories.map(async (category_name) => {
          const category = new Category();
          category.avatar_url = 'https://example.com/avatar.jpg';
          category.name = category_name;
          category.organization = organization;
          category.courses = new_wassce_courses;

          return category;
        }),
      );

      await this.categoryRepository.save([...new_categories]);

      return 'Done!';
    } catch (err) {}
  }
}
