import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart as CartTypeClass } from 'src/database/entities/cart.entity';
import { Checkout as CheckoutTypeClass } from 'src/database/entities/checkout.entity';
import { Student as StudentTypeClass } from 'src/database/entities/student.entity';
import { HashHelper, PaginateHelper } from 'src/helpers';
import { PaginationInput } from 'src/helpers/inputs';
import { ILike, Repository } from 'typeorm';
import {
  Category,
  Checkout,
  Course,
  Organization,
  Student,
  Test,
} from '../../../database/entities';
import { TimeEventType } from '../../../database/entities/time_event.entity';
import {
  TestModeType,
  TestStatusType,
} from '../../../database/entities/test.entity';
import { AttemptFilterInput, CourseFilterInput } from '../inputs';
import {
  StudentStatsResponse,
  SubjectProgressResponse,
  TestScoreHistoryResponse,
  WeakSubjectAreaResponse,
} from '../types';
// import { Course as CourseTypeClass } from 'src/database/entities/course.entity';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Test)
    private testRepository: Repository<Test>,
  ) {}

  async getOrganizationCourse({
    email,
    courseId,
  }: {
    email: string;
    courseId: string;
  }): Promise<Course> {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await this.studentRepository.findOne({
          where: {
            email,
          },
          relations: ['subscribed_courses', 'cart.courses'],
        });

        if (!student) {
          throw new NotFoundException('Student not found');
        }

        const course = await transactionalEntityManager.findOne(Course, {
          where: {
            id: courseId,
            organization: {
              students: {
                email,
              },
            },
          },
          relations: [
            'approved_version.questions',
            'approved_version.assigned_admin',
            'versions.questions',
            'versions.assigned_admin',
            'instructor',
          ],
        });

        return {
          ...course,
          is_subscribed: Boolean(
            student.subscribed_courses.find((crs) => crs.id === course.id),
          ),
          is_course_in_cart: Boolean(
            student.cart.courses.find((crs) => crs.id === course.id),
          ),
        };
      },
    );
  }

  async listOrganizationCoursesPaginated({
    email,
    organizationId,
    searchTerm,
    pagination,
    filter,
  }: {
    email: string;
    organizationId?: string;
    searchTerm?: string;
    pagination?: PaginationInput;
    filter?: CourseFilterInput;
  }) {
    const courses = await this.listOrganizationCourses({
      email,
      organizationId,
      searchTerm,
      filter,
    });

    // Apply pagination and return in the connection format
    return PaginateHelper.paginate<Course>(courses, pagination, (course) =>
      course.id.toString(),
    );
  }

  async listOrganizationCourses({
    email,
    organizationId,
    searchTerm,
    filter,
  }: {
    email: string;
    organizationId?: string;
    searchTerm?: string;
    filter?: CourseFilterInput;
  }): Promise<Course[]> {
    const student = await this.studentRepository.findOne({
      where: {
        email,
      },
      relations: ['subscribed_courses'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const courses = await this.courseRepository.find({
      where: {
        organization: {
          id: organizationId ?? undefined,
          students: {
            email,
          },
        },
        title: searchTerm ? ILike(`%${searchTerm.trim()}%`) : undefined,
      },
      relations: [
        'instructor',
        'approved_version.questions',
        'approved_version.test_suites',
      ],
    });

    return courses
      .filter((course) => course.approved_version)
      .map((course) => ({
        ...course,
        is_subscribed: Boolean(
          student.subscribed_courses.find((crs) => crs.id === course.id),
        ),
        total_questions: course.approved_version.questions.length,
        estimated_duration: course.approved_version.questions.reduce(
          (acc, question) => acc + question.estimated_time_in_ms,
          0,
        ),
      }))
      .filter((course) =>
        filter ? filter.is_subscribed === course.is_subscribed : true,
      );
  }

  async listCartCourses({ email }: { email: string }): Promise<Course[]> {
    const student = await this.studentRepository.findOne({
      where: {
        email,
      },
      relations: ['cart.courses'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student.cart.courses || [];
  }

  async listCartCategories({ email }: { email: string }): Promise<Category[]> {
    const student = await this.studentRepository.findOne({
      where: {
        email,
      },
      relations: ['cart.categories'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student.cart.categories || [];
  }

  async listOrganizationCategories({
    email,
    searchTerm,
  }: {
    email: string;
    searchTerm?: string;
  }): Promise<Category[]> {
    const student = await this.studentRepository.findOne({
      where: {
        email,
      },
      relations: ['organizations'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const organizationEmail = student.organizations.at(0).email;

    const categories = await this.categoryRepository.find({
      where: {
        organization: {
          email: organizationEmail,
        },
        name: searchTerm ? ILike(`%${searchTerm.trim()}%`) : undefined,
      },
      relations: ['courses'],
    });

    return categories;
  }

  async addCourseToCart({
    email,
    courseId,
  }: {
    email: string;
    courseId: string;
  }): Promise<CartTypeClass> {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: { email },
          relations: ['cart.courses'],
        });

        if (!student) {
          throw new Error('Student not found');
        }

        const course = await transactionalEntityManager.findOne(Course, {
          where: {
            id: courseId,
            organization: {
              students: {
                email,
              },
            },
          },
        });

        if (!course) {
          throw new Error('Course not found');
        }

        student.cart.courses.push(course);

        return await transactionalEntityManager.save(student.cart);
      },
    );
  }

  async removeCourseFromCart({
    email,
    courseId,
  }: {
    email: string;
    courseId: string;
  }): Promise<CartTypeClass> {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: { email },
          relations: ['cart.courses'],
        });

        if (!student) {
          throw new Error('Student not found');
        }

        student.cart.courses = student.cart.courses.filter(
          (crs) => crs.id !== courseId,
        );

        return await transactionalEntityManager.save(student.cart);
      },
    );
  }

  async addCategoryToCart({
    email,
    categoryId,
  }: {
    email: string;
    categoryId: string;
  }): Promise<CartTypeClass> {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: { email },
          relations: ['cart.categories'],
        });

        if (!student) {
          throw new Error('Student not found');
        }

        const category = await transactionalEntityManager.findOne(Category, {
          where: {
            id: categoryId,
            organization: {
              students: {
                email,
              },
            },
          },
          relations: ['courses'],
        });

        if (!category) {
          throw new Error('Category not found');
        }

        student.cart.categories.push(category);

        return await transactionalEntityManager.save(student.cart);
      },
    );
  }

  async createCheckout({
    email,
    courseId,
    checkoutFromCart,
    autoApproveSubscription,
  }: {
    email: string;
    courseId?: string;
    checkoutFromCart?: boolean;
    autoApproveSubscription: boolean;
  }): Promise<CheckoutTypeClass> {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: { email },
          relations: [
            'cart.courses',
            'cart.categories.courses',
            'subscribed_courses',
            'subscribed_categories',
          ],
        });

        if (!student) {
          throw new Error('Student not found');
        }

        let courseToSubscribeTo: Course[] = [];
        const categories = student.cart.categories;

        if (checkoutFromCart && courseId) {
          if (student.cart.courses.some((c) => c.id === courseId)) {
            courseToSubscribeTo.push(
              ...student.cart.courses,
              ...student.cart.categories
                .map((category) => category.courses)
                .flat()
                .filter(
                  (course) =>
                    !student.subscribed_courses
                      .map((crs) => crs.id)
                      .includes(course.id),
                ),
            );

            courseToSubscribeTo = [
              ...new Map(
                courseToSubscribeTo.map((course) => [course.id, course]),
              ).values(),
            ];
          } else {
            const course = await transactionalEntityManager.findOne(Course, {
              where: {
                id: courseId,
                organization: {
                  students: {
                    email,
                  },
                },
              },
            });

            if (!course) {
              throw new Error('Course not found');
            }

            courseToSubscribeTo.push(
              ...student.cart.courses,
              ...student.cart.categories
                .map((category) => category.courses)
                .flat()
                .filter(
                  (course) =>
                    !student.subscribed_courses
                      .map((crs) => crs.id)
                      .includes(course.id),
                ),
              course,
            );

            courseToSubscribeTo = [
              ...new Map(
                courseToSubscribeTo.map((course) => [course.id, course]),
              ).values(),
            ];
          }

          student.cart.courses = [];
          student.cart.categories = [];
        } else if (checkoutFromCart) {
          courseToSubscribeTo.push(
            ...student.cart.courses,
            ...student.cart.categories
              .map((category) => category.courses)
              .map((courses) => courses)
              .flat()
              .filter(
                (course) =>
                  !student.subscribed_courses
                    .map((crs) => crs.id)
                    .includes(course.id),
              ),
          );
          courseToSubscribeTo = [
            ...new Map(
              courseToSubscribeTo.map((course) => [course.id, course]),
            ).values(),
          ];

          student.cart.courses = [];
          student.cart.categories = [];
        } else if (courseId) {
          const course = await transactionalEntityManager.findOne(Course, {
            where: {
              id: courseId,
              organization: {
                students: {
                  email,
                },
              },
            },
          });

          if (!course) {
            throw new Error('Course not found');
          }

          courseToSubscribeTo.push(course);
          student.cart.courses = student.cart.courses.filter(
            (course) => course.id !== courseId,
          );
        } else {
          throw new Error(
            'Invalid checkout, you must either checkout from cart or provide a course ID',
          );
        }

        if (autoApproveSubscription) {
          student.subscribed_courses.push(...courseToSubscribeTo);
          student.subscribed_categories.push(...categories);
          await transactionalEntityManager.save(student);
        }

        await transactionalEntityManager.save(student.cart);

        const checkout = new Checkout();
        checkout.student = student;
        checkout.courses = courseToSubscribeTo;
        checkout.categories = categories;
        return await transactionalEntityManager.save(checkout);
      },
    );
  }

  async completeSetup({
    email,
    categoryId,
    courseIds,
  }: {
    email: string;
    categoryId: string;
    courseIds: string[];
  }): Promise<StudentTypeClass> {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: { email },
          relations: [
            'cart.courses',
            'cart.categories.courses',
            'subscribed_courses',
            'subscribed_categories',
          ],
        });

        if (!student) {
          throw new Error('Student not found');
        }

        // Throw an error if category has been subscribed to
        if (
          student.subscribed_categories.find((cat) => cat.id === categoryId)
        ) {
          throw new BadRequestException(
            'You have already subscribed to this category',
          );
        }

        const category = await transactionalEntityManager.findOne(Category, {
          where: {
            id: categoryId,
            organization: {
              students: {
                email,
              },
            },
          },
          relations: ['courses'],
        });

        if (!category) {
          throw new Error('Category not found');
        }

        const subscribedCourseIds = new Set(
          student.subscribed_courses.map((c) => c.id),
        );

        const newCourses = category.courses.filter(
          (c) => courseIds.includes(c.id) && !subscribedCourseIds.has(c.id),
        );

        student.subscribed_categories.push(category);
        student.subscribed_courses.push(...newCourses);
        student.is_setup_completed = true;

        return await transactionalEntityManager.save(student);
      },
    );
  }

  async listAttempts({
    email,
    searchTerm,
    filter,
    pagination,
  }: {
    email: string;
    searchTerm?: string;
    filter?: AttemptFilterInput;
    pagination?: PaginationInput;
  }) {
    const student = await this.studentRepository.findOne({
      where: { email },
      relations: [
        'tests.test_suite.course_version.course',
        'tests.submitted_answers.question',
        'tests.time_events',
      ],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const computeScore = (test: Test): number => {
      const { submitted_answers: answers } = test;
      if (!answers.length) return 0;
      const correct = answers.filter(
        (a) => a.answer_provided === a.question?.correct_answer,
      ).length;
      return (correct / answers.length) * 100;
    };

    const computeStudyMs = (test: Test): number => {
      const events = [...test.time_events].sort(
        (a, b) =>
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
      );
      let total = 0;
      let sessionStart: Date | null = null;
      for (const event of events) {
        if (
          event.type === TimeEventType.STARTED ||
          event.type === TimeEventType.RESUMED
        ) {
          sessionStart = new Date(event.recorded_at);
        } else if (
          (event.type === TimeEventType.PAUSED ||
            event.type === TimeEventType.ENDED) &&
          sessionStart
        ) {
          total +=
            new Date(event.recorded_at).getTime() - sessionStart.getTime();
          sessionStart = null;
        }
      }
      return total;
    };

    const endedTests = student.tests.filter(
      (t) => t.status === TestStatusType.ENDED,
    );

    // Enrich all ended tests first so trend can look across the full history
    const enriched = endedTests.map((test) => {
      const answers = test.submitted_answers;
      const correct = answers.filter(
        (a) => a.answer_provided === a.question?.correct_answer,
      ).length;
      const wrong = answers.length - correct;
      const score = computeScore(test);
      const startEvent = test.time_events.find(
        (e) => e.type === TimeEventType.STARTED,
      );
      const date_taken = startEvent
        ? new Date(startEvent.recorded_at)
        : new Date();
      const time_taken = computeStudyMs(test);
      const course_title = test.test_suite?.course_version?.course?.title ?? '';
      const course_id = test.test_suite?.course_version?.course?.id ?? '';

      return {
        ...test,
        course_title,
        course_id,
        score,
        date_taken,
        correct,
        wrong,
        time_taken,
        trend: null as number | null,
      };
    });

    // Compute trend: compare each attempt against the previous attempt on the same course
    const courseId = (t: (typeof enriched)[number]) =>
      t.test_suite?.course_version?.course?.id;

    for (const attempt of enriched) {
      const cid = courseId(attempt);
      if (!cid || !attempt.date_taken) continue;

      const sameCourse = enriched
        .filter((a) => courseId(a) === cid && a.date_taken)
        .sort((a, b) => a.date_taken.getTime() - b.date_taken.getTime());

      const idx = sameCourse.findIndex((a) => a.id === attempt.id);
      if (idx > 0) {
        attempt.trend = attempt.score - sameCourse[idx - 1].score;
      }
    }

    // Sort most recent first
    enriched.sort((a, b) => {
      if (!a.date_taken) return 1;
      if (!b.date_taken) return -1;
      return b.date_taken.getTime() - a.date_taken.getTime();
    });

    let attempts = enriched;

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      attempts = attempts.filter((t) => {
        return (
          t.course_title.toLowerCase().includes(term) ||
          (t.test_suite?.title?.toLowerCase() ?? '').includes(term)
        );
      });
    }

    if (filter?.from || filter?.to) {
      attempts = attempts.filter((t) => {
        if (!t.date_taken) return false;
        if (filter.from && t.date_taken < new Date(filter.from)) return false;
        if (filter.to && t.date_taken > new Date(filter.to)) return false;
        return true;
      });
    }

    return PaginateHelper.paginate(attempts, pagination, (t) => t.id);
  }

  async getActiveTest({ email }: { email: string }) {
    const student = await this.studentRepository.findOne({
      where: { email },
      relations: [
        'tests.submitted_answers.question',
        'tests.test_suite.questions',
        'tests.test_suite.course_version.course',
        'tests.time_events',
      ],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const activeTest = student.tests.find(
      (t) =>
        t.status === TestStatusType.ON_GOING ||
        t.status === TestStatusType.PAUSED,
    );

    if (!activeTest) {
      throw new NotFoundException('No active test found');
    }

    return {
      ...activeTest,
      course_id: activeTest.test_suite?.course_version?.course?.id ?? null,
    };
  }

  async getTest({ email, testId }: { email: string; testId: string }) {
    const test = await this.testRepository.findOne({
      where: { id: testId, student: { email } },
      relations: [
        'submitted_answers.question',
        'test_suite.questions',
        'test_suite.course_version.course',
        'time_events',
      ],
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    return {
      ...test,
      course_id: test.test_suite?.course_version?.course?.id ?? null,
    };
  }

  async getStats({ email }: { email: string }): Promise<StudentStatsResponse> {
    const student = await this.studentRepository.findOne({
      where: { email },
      relations: ['tests.submitted_answers.question', 'tests.time_events'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const endedTests = student.tests.filter(
      (t) => t.status === TestStatusType.ENDED,
    );

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = thisMonthStart;

    const getTestStartTime = (test: Test): Date | null => {
      const event = test.time_events.find(
        (e) => e.type === TimeEventType.STARTED,
      );
      return event ? new Date(event.recorded_at) : null;
    };

    const thisMonthTests = endedTests.filter((t) => {
      const start = getTestStartTime(t);
      return start && start >= thisMonthStart;
    });

    const lastMonthTests = endedTests.filter((t) => {
      const start = getTestStartTime(t);
      return start && start >= lastMonthStart && start < lastMonthEnd;
    });

    const computeScore = (test: Test): number => {
      const answers = test.submitted_answers;
      if (!answers.length) return 0;
      const correct = answers.filter(
        (a) => a.answer_provided === a.question.correct_answer,
      ).length;
      return (correct / answers.length) * 100;
    };

    const computeAverage = (tests: Test[]): number => {
      if (!tests.length) return 0;
      return tests.reduce((sum, t) => sum + computeScore(t), 0) / tests.length;
    };

    const computePercentageChange = (
      current: number,
      previous: number,
    ): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const computeStudyMs = (test: Test): number => {
      const events = [...test.time_events].sort(
        (a, b) =>
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
      );
      let total = 0;
      let sessionStart: Date | null = null;
      for (const event of events) {
        if (
          event.type === TimeEventType.STARTED ||
          event.type === TimeEventType.RESUMED
        ) {
          sessionStart = new Date(event.recorded_at);
        } else if (
          (event.type === TimeEventType.PAUSED ||
            event.type === TimeEventType.ENDED) &&
          sessionStart
        ) {
          total +=
            new Date(event.recorded_at).getTime() - sessionStart.getTime();
          sessionStart = null;
        }
      }
      return total;
    };

    const thisMonthCount = thisMonthTests.length;
    const lastMonthCount = lastMonthTests.length;
    const thisMonthAvg = computeAverage(thisMonthTests);
    const lastMonthAvg = computeAverage(lastMonthTests);

    const totalStudyMs = endedTests.reduce(
      (sum, t) => sum + computeStudyMs(t),
      0,
    );

    const tagErrorCount = new Map<string, number>();
    for (const test of endedTests) {
      for (const answer of test.submitted_answers) {
        if (answer.answer_provided !== answer.question.correct_answer) {
          for (const tag of answer.question.tags) {
            tagErrorCount.set(tag, (tagErrorCount.get(tag) ?? 0) + 1);
          }
        }
      }
    }

    return {
      total_test_taken: endedTests.length,
      total_test_taken_percentage_change: computePercentageChange(
        thisMonthCount,
        lastMonthCount,
      ),
      average_score: computeAverage(endedTests),
      average_score_percentage_change: computePercentageChange(
        thisMonthAvg,
        lastMonthAvg,
      ),
      study_hours: totalStudyMs / (1000 * 60 * 60),
      weak_areas_count: tagErrorCount.size,
    };
  }

  async studentSubjectProgress({
    email,
    testId,
  }: {
    email: string;
    testId?: string;
  }): Promise<SubjectProgressResponse[]> {
    const student = await this.studentRepository.findOne({
      where: { email },
      relations: ['tests.submitted_answers.question'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    let endedTests = student.tests.filter(
      (t) => t.status === TestStatusType.ENDED,
    );

    if (testId) {
      endedTests = endedTests.filter((t) => t.id === testId);
      if (!endedTests.length) {
        throw new NotFoundException('Test not found or not yet ended');
      }
    }

    const tagStats = new Map<
      string,
      { total: number; correct: number; wrong: number }
    >();

    for (const test of endedTests) {
      for (const answer of test.submitted_answers) {
        const isCorrect =
          answer.answer_provided === answer.question?.correct_answer;
        for (const tag of answer.question?.tags ?? []) {
          const stat = tagStats.get(tag) ?? { total: 0, correct: 0, wrong: 0 };
          stat.total += 1;
          if (isCorrect) stat.correct += 1;
          else stat.wrong += 1;
          tagStats.set(tag, stat);
        }
      }
    }

    return Array.from(tagStats.entries()).map(([subject, stat]) => ({
      subject,
      total: stat.total,
      correct: stat.correct,
      wrong: stat.wrong,
      score: stat.total > 0 ? (stat.correct / stat.total) * 100 : 0,
    }));
  }

  async weakSubjectAreas({
    email,
    testId,
  }: {
    email: string;
    testId?: string;
  }): Promise<WeakSubjectAreaResponse[]> {
    const student = await this.studentRepository.findOne({
      where: { email },
      relations: [
        'tests.submitted_answers.question',
        'tests.test_suite.questions',
      ],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    let endedTests = student.tests.filter(
      (t) => t.status === TestStatusType.ENDED,
    );

    if (testId) {
      endedTests = endedTests.filter((t) => t.id === testId);
      if (!endedTests.length) {
        throw new NotFoundException('Test not found or not yet ended');
      }
    }

    const tagStats = new Map<string, { error_count: number; total: number }>();

    for (const test of endedTests) {
      const answeredQuestionIds = new Set(
        test.submitted_answers.map((a) => a.question?.id).filter(Boolean),
      );

      for (const answer of test.submitted_answers) {
        const isCorrect =
          answer.answer_provided === answer.question?.correct_answer;
        for (const tag of answer.question?.tags ?? []) {
          const stat = tagStats.get(tag) ?? { error_count: 0, total: 0 };
          stat.total += 1;
          if (!isCorrect) stat.error_count += 1;
          tagStats.set(tag, stat);
        }
      }

      for (const question of test.test_suite?.questions ?? []) {
        if (answeredQuestionIds.has(question.id)) continue;
        for (const tag of question.tags ?? []) {
          const stat = tagStats.get(tag) ?? { error_count: 0, total: 0 };
          stat.total += 1;
          stat.error_count += 1;
          tagStats.set(tag, stat);
        }
      }
    }

    return Array.from(tagStats.entries())
      .map(([subject, stat]) => ({
        subject,
        error_count: stat.error_count,
        total: stat.total,
        accuracy:
          stat.total > 0
            ? ((stat.total - stat.error_count) / stat.total) * 100
            : 100,
      }))
      .filter((item) => item.accuracy <= 65)
      .sort((a, b) => a.accuracy - b.accuracy);
  }

  async getTestScoreHistory({
    email,
    testId,
  }: {
    email: string;
    testId?: string;
  }): Promise<TestScoreHistoryResponse[]> {
    const student = await this.studentRepository.findOne({
      where: { email },
      relations: [
        'tests.submitted_answers.question',
        'tests.time_events',
        'tests.test_suite.course_version.course',
      ],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    let testMode: TestModeType | undefined;
    let courseId: string | undefined;
    if (testId) {
      const test = student.tests.find((t) => t.id === testId);
      if (!test) {
        throw new NotFoundException('Test not found');
      }
      testMode = test.mode;
      courseId = test.test_suite?.course_version?.course?.id;
    }

    const endedTests = student.tests.filter(
      (t) =>
        t.status === TestStatusType.ENDED &&
        (testMode === undefined || t.mode === testMode) &&
        (courseId === undefined ||
          t.test_suite?.course_version?.course?.id === courseId),
    );

    return endedTests
      .map((test) => {
        const answers = test.submitted_answers;
        const correct = answers.filter(
          (a) => a.answer_provided === a.question?.correct_answer,
        ).length;
        const score = answers.length > 0 ? (correct / answers.length) * 100 : 0;

        const startEvent = test.time_events.find(
          (e) => e.type === TimeEventType.STARTED,
        );
        const date_taken = startEvent
          ? new Date(startEvent.recorded_at)
          : new Date();

        const course_title =
          test.test_suite?.course_version?.course?.title ?? '';

        return {
          test_id: test.id,
          course_title,
          score,
          date_taken,
        };
      })
      .sort((a, b) => b.date_taken.getTime() - a.date_taken.getTime())
      .slice(0, 10);
  }

  async changeStudentPassword({
    email,
    currentPassword,
    newPassword,
  }: {
    email: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<StudentTypeClass> {
    const student = await this.studentRepository.findOne({ where: { email } });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const isValid = await HashHelper.compare(currentPassword, student.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    student.password = await HashHelper.encrypt(newPassword);
    return await this.studentRepository.save(student);
  }
}
