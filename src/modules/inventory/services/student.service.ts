import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart as CartTypeClass } from '../entities/cart.entity';
import { Checkout as CheckoutTypeClass } from '../entities/checkout.entity';
import { Student as StudentTypeClass } from '../../auth/entities/student.entity';
import { HashHelper, PaginateHelper } from '../../../helpers';
import { PaginationInput } from '../../../helpers/inputs';
import { ILike, Repository } from 'typeorm';
import { Organization } from '../../auth/entities/organization.entity';
import { Student } from '../../auth/entities/student.entity';
import { Category } from '../entities/category.entity';
import { Checkout } from '../entities/checkout.entity';
import { Course } from '../entities/course.entity';
import { Question } from '../../review/entities/question.entity';
import { TestSuite, SuiteType } from '../../review/entities/test_suite.entity';
import { Test } from '../../simulation/entities/test.entity';
import { TimeEventType } from '../../simulation/entities/time_event.entity';
import {
  TestModeType,
  TestStatusType,
} from '../../simulation/entities/test.entity';
import { AttemptFilterInput, CourseFilterInput } from '../inputs';
import {
  CategoryCountdownResponse,
  CourseAggregateEntry,
  StudentAggregateResponse,
  StudentAggregateStateType,
  StudentStatsResponse,
  SubjectProgressResponse,
  TestScoreHistoryResponse,
  TestTopicProgressResponse,
  WeakSubjectAreaResponse,
} from '../types';
import {
  AggregateState,
  GRADING_STRATEGIES,
  GradedCourse,
  buildAggregateMessage,
  computeAggregateRange,
} from './grading-strategies';
// import { Course as CourseTypeClass } from 'src/modules/inventory/entities/course.entity';

const FIVE_MIN_MS = 5 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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
    @InjectRepository(TestSuite)
    private testSuiteRepository: Repository<TestSuite>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getOrganizationCourse({
    id,
    courseId,
  }: {
    id: string;
    courseId: string;
  }): Promise<Course> {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await this.studentRepository.findOne({
          where: {
            id,
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
                id,
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
    id,
    organizationId,
    searchTerm,
    pagination,
    filter,
  }: {
    id: string;
    organizationId?: string;
    searchTerm?: string;
    pagination?: PaginationInput;
    filter?: CourseFilterInput;
  }) {
    const courses = await this.listOrganizationCourses({
      id,
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
    id,
    organizationId,
    searchTerm,
    filter,
  }: {
    id: string;
    organizationId?: string;
    searchTerm?: string;
    filter?: CourseFilterInput;
  }): Promise<Course[]> {
    const student = await this.studentRepository.findOne({
      where: {
        id,
      },
      relations: ['subscribed_courses', 'subscribed_categories'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const categoryId = student.subscribed_categories?.[0]?.id;

    const courses = await this.courseRepository.find({
      where: {
        organization: {
          id: organizationId ?? undefined,
          students: {
            id,
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

    // after the approved_version filter:
    const withVersion = courses.filter(
      (c) =>
        c.approved_version &&
        Boolean(student.subscribed_courses.find((crs) => crs.id === c.id)),
    );

    return withVersion.map((course) => {
      const test_suites = categoryId
        ? course.approved_version.test_suites.filter(
            (suite) => suite.categoryId === categoryId,
          )
        : course.approved_version.test_suites;

      return {
        ...course,
        approved_version: {
          ...course.approved_version,
          test_suites,
        },
        is_subscribed: Boolean(
          student.subscribed_courses.find((crs) => crs.id === course.id),
        ),
        total_questions: course.approved_version.questions.length,
        estimated_duration: course.approved_version.questions.reduce(
          (acc, question) => acc + question.estimated_time_in_ms,
          0,
        ),
      };
    });
  }

  async listCartCourses({ id }: { id: string }): Promise<Course[]> {
    const student = await this.studentRepository.findOne({
      where: {
        id,
      },
      relations: ['cart.courses'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student.cart.courses || [];
  }

  async listCartCategories({ id }: { id: string }): Promise<Category[]> {
    const student = await this.studentRepository.findOne({
      where: {
        id,
      },
      relations: ['cart.categories'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student.cart.categories || [];
  }

  async listOrganizationCategories({
    id,
    searchTerm,
  }: {
    id: string;
    searchTerm?: string;
  }): Promise<Category[]> {
    const cacheKey = `student-org-categories:${id}`;
    if (!searchTerm) {
      const cached = await this.cacheManager.get<Category[]>(cacheKey);
      if (cached) return cached;
    }

    const student = await this.studentRepository.findOne({
      where: {
        id,
      },
      relations: ['organizations'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const organizationId = student.organizations.at(0).id;

    const categories = await this.categoryRepository.find({
      where: {
        organization: {
          id: organizationId,
        },
        name: searchTerm ? ILike(`%${searchTerm.trim()}%`) : undefined,
      },
      relations: ['courses'],
    });

    if (!searchTerm) {
      await this.cacheManager.set(cacheKey, categories, FIVE_MIN_MS);
    }
    return categories;
  }

  async addCourseToCart({
    id,
    courseId,
  }: {
    id: string;
    courseId: string;
  }): Promise<CartTypeClass> {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: { id },
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
                id,
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
    id,
    courseId,
  }: {
    id: string;
    courseId: string;
  }): Promise<CartTypeClass> {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: { id },
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
    id,
    categoryId,
  }: {
    id: string;
    categoryId: string;
  }): Promise<CartTypeClass> {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: { id },
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
                id,
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
    id,
    courseId,
    checkoutFromCart,
    autoApproveSubscription,
  }: {
    id: string;
    courseId?: string;
    checkoutFromCart?: boolean;
    autoApproveSubscription: boolean;
  }): Promise<CheckoutTypeClass> {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: { id },
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
                    id,
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
                  id,
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
    id,
    categoryId,
    courseIds,
  }: {
    id: string;
    categoryId: string;
    courseIds: string[];
  }): Promise<StudentTypeClass> {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: { id },
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
                id,
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
    id,
    searchTerm,
    filter,
    pagination,
  }: {
    id: string;
    searchTerm?: string;
    filter?: AttemptFilterInput;
    pagination?: PaginationInput;
  }) {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: [
        'tests.test_suite.course_version.course',
        'tests.test_suite.questions',
        'tests.submitted_answers.question',
        'tests.time_events',
      ],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const computeScore = (test: Test): number => {
      const answers = test.submitted_answers;
      const totalQuestions =
        test.test_suite?.questions?.length ?? answers.length;
      if (!totalQuestions) return 0;
      const correct = answers.filter((a) => a.is_correct === true).length;
      return (correct / totalQuestions) * 100;
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
      const correct = answers.filter((a) => a.is_correct === true).length;
      const totalQuestions =
        test.test_suite?.questions?.length ?? answers.length;
      const wrong = totalQuestions - correct;
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

  async getActiveTest({ id }: { id: string }) {
    const student = await this.studentRepository.findOne({
      where: { id },
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

  async getTest({ id, testId }: { id: string; testId: string }) {
    const test = await this.testRepository.findOne({
      where: { id: testId, student: { id } },
      relations: [
        'submitted_answers.question',
        'test_suite.questions',
        'test_suite.course_version.course.categories',
        'time_events',
      ],
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    const categories =
      test.test_suite?.course_version?.course?.categories ?? [];
    const course_category = categories.length > 0 ? categories[0].name : null;

    return {
      ...test,
      course_id: test.test_suite?.course_version?.course?.id ?? null,
      course_category,
    };
  }

  async getStats({ id }: { id: string }): Promise<StudentStatsResponse> {
    const cacheKey = `student-stats:${id}`;
    const cached = await this.cacheManager.get<StudentStatsResponse>(cacheKey);
    if (cached) return cached;

    const student = await this.studentRepository.findOne({
      where: { id },
      relations: [
        'tests.submitted_answers.question',
        'tests.time_events',
        'tests.test_suite.questions',
      ],
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
      const totalQuestions =
        test.test_suite?.questions?.length ?? answers.length;
      if (!totalQuestions) return 0;
      const correct = answers.filter((a) => a.is_correct === true).length;
      return (correct / totalQuestions) * 100;
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
        if (answer.is_correct !== true) {
          for (const tag of answer.question.tags) {
            tagErrorCount.set(tag, (tagErrorCount.get(tag) ?? 0) + 1);
          }
        }
      }
    }

    const result = {
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

    await this.cacheManager.set(cacheKey, result, SEVEN_DAYS_MS);
    return result;
  }

  async studentSubjectProgress({
    id,
    testId,
  }: {
    id: string;
    testId?: string;
  }): Promise<SubjectProgressResponse[]> {
    const cacheKey = `student-subject-progress:${id}:${testId ?? 'all'}`;
    const ttl = testId ? THIRTY_DAYS_MS : SEVEN_DAYS_MS;
    const cached =
      await this.cacheManager.get<SubjectProgressResponse[]>(cacheKey);
    if (cached) return cached;

    const student = await this.studentRepository.findOne({
      where: { id },
      relations: [
        'tests.submitted_answers',
        'tests.test_suite.course_version.course',
        'tests.test_suite.questions',
        'tests.time_events',
      ],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const RECENT_TEST_CAP = 10;

    let endedTests = student.tests.filter(
      (t) => t.status === TestStatusType.ENDED,
    );

    if (testId) {
      endedTests = endedTests.filter(
        (t) => t.test_suite?.course_version?.course?.id === testId,
      );
    }

    const recentTests = endedTests
      .map((t) => {
        const startEvent = t.time_events?.find(
          (e) => e.type === TimeEventType.STARTED,
        );
        return { test: t, startedAt: startEvent?.recorded_at ?? new Date(0) };
      })
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      )
      .slice(0, RECENT_TEST_CAP)
      .map((x) => x.test);

    const courseStats = new Map<
      string,
      {
        sessions: number;
        correct: number;
        wrong: number;
        total_questions: number;
      }
    >();

    for (const test of recentTests) {
      const courseTitle = test.test_suite?.course_version?.course?.title;
      if (!courseTitle) continue;

      const stat = courseStats.get(courseTitle) ?? {
        sessions: 0,
        correct: 0,
        wrong: 0,
        total_questions: 0,
      };
      stat.sessions += 1;
      stat.total_questions +=
        test.test_suite?.questions?.length ?? test.submitted_answers.length;

      for (const answer of test.submitted_answers) {
        if (answer.is_correct === true) stat.correct += 1;
      }

      courseStats.set(courseTitle, stat);
    }

    const result = Array.from(courseStats.entries()).map(([subject, stat]) => ({
      subject,
      total: stat.sessions,
      correct: stat.correct,
      wrong: stat.total_questions - stat.correct,
      score:
        stat.total_questions > 0
          ? (stat.correct / stat.total_questions) * 100
          : 0,
    }));

    await this.cacheManager.set(cacheKey, result, ttl);
    return result;
  }

  async studentTestTopicProgress({
    id,
    testId,
  }: {
    id: string;
    testId: string;
  }): Promise<TestTopicProgressResponse[]> {
    const cacheKey = `student-topic-progress:${id}:${testId}`;
    const cached =
      await this.cacheManager.get<TestTopicProgressResponse[]>(cacheKey);
    if (cached) return cached;

    const student = await this.studentRepository.findOne({
      where: { id },
      relations: [
        'tests.submitted_answers.question',
        'tests.test_suite.questions',
      ],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const test = student.tests.find(
      (t) => t.id === testId && t.status === TestStatusType.ENDED,
    );

    if (!test) {
      throw new NotFoundException('Test not found or not yet ended');
    }

    const tagStats = new Map<string, { correct: number; wrong: number }>();

    const answeredQuestionIds = new Set(
      test.submitted_answers.map((a) => a.question?.id).filter(Boolean),
    );

    for (const answer of test.submitted_answers) {
      for (const tag of answer.question?.tags ?? []) {
        const stat = tagStats.get(tag) ?? { correct: 0, wrong: 0 };
        if (answer.is_correct === true) stat.correct += 1;
        else stat.wrong += 1;
        tagStats.set(tag, stat);
      }
    }

    for (const question of test.test_suite?.questions ?? []) {
      if (answeredQuestionIds.has(question.id)) continue;
      for (const tag of question.tags ?? []) {
        const stat = tagStats.get(tag) ?? { correct: 0, wrong: 0 };
        stat.wrong += 1;
        tagStats.set(tag, stat);
      }
    }

    const result = Array.from(tagStats.entries()).map(([topic, stat]) => {
      const total = stat.correct + stat.wrong;
      return {
        topic,
        total,
        correct: stat.correct,
        wrong: stat.wrong,
        score: total > 0 ? (stat.correct / total) * 100 : 0,
      };
    });

    await this.cacheManager.set(cacheKey, result, THIRTY_DAYS_MS);
    return result;
  }

  async weakSubjectAreas({
    id,
    testId,
  }: {
    id: string;
    testId?: string;
  }): Promise<WeakSubjectAreaResponse[]> {
    const cacheKey = `student-weak-areas:${id}:${testId ?? 'all'}`;
    const ttl = testId ? THIRTY_DAYS_MS : SEVEN_DAYS_MS;
    const cached =
      await this.cacheManager.get<WeakSubjectAreaResponse[]>(cacheKey);
    if (cached) return cached;

    const student = await this.studentRepository.findOne({
      where: { id },
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

    const tagStats = new Map<
      string,
      { error_count: number; total: number; questions: Map<string, Question> }
    >();

    for (const test of endedTests) {
      const answeredQuestionIds = new Set(
        test.submitted_answers.map((a) => a.question?.id).filter(Boolean),
      );

      for (const answer of test.submitted_answers) {
        const isCorrect = answer.is_correct === true;
        for (const tag of answer.question?.tags ?? []) {
          const stat = tagStats.get(tag) ?? {
            error_count: 0,
            total: 0,
            questions: new Map(),
          };
          stat.total += 1;
          if (!isCorrect) {
            stat.error_count += 1;
            if (answer.question)
              stat.questions.set(answer.question.id, answer.question);
          }
          tagStats.set(tag, stat);
        }
      }

      for (const question of test.test_suite?.questions ?? []) {
        if (answeredQuestionIds.has(question.id)) continue;
        for (const tag of question.tags ?? []) {
          const stat = tagStats.get(tag) ?? {
            error_count: 0,
            total: 0,
            questions: new Map(),
          };
          stat.total += 1;
          stat.error_count += 1;
          stat.questions.set(question.id, question);
          tagStats.set(tag, stat);
        }
      }
    }

    const result = Array.from(tagStats.entries())
      .map(([subject, stat]) => ({
        subject,
        error_count: stat.error_count,
        total: stat.total,
        accuracy:
          stat.total > 0
            ? ((stat.total - stat.error_count) / stat.total) * 100
            : 100,
        questions: Array.from(stat.questions.values()),
      }))
      .filter((item) => item.accuracy <= 65)
      .sort((a, b) => a.accuracy - b.accuracy);

    await this.cacheManager.set(cacheKey, result, ttl);
    return result;
  }

  async getTestScoreHistory({
    id,
    testId,
  }: {
    id: string;
    testId?: string;
  }): Promise<TestScoreHistoryResponse[]> {
    const cacheKey = `student-score-history:${id}:${testId ?? 'all'}`;
    const ttl = testId ? THIRTY_DAYS_MS : SEVEN_DAYS_MS;
    const cached =
      await this.cacheManager.get<TestScoreHistoryResponse[]>(cacheKey);
    if (cached) return cached;

    const student = await this.studentRepository.findOne({
      where: { id },
      relations: [
        'tests.submitted_answers.question',
        'tests.time_events',
        'tests.test_suite.course_version.course',
        'tests.test_suite.questions',
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

    const result = endedTests
      .map((test) => {
        const answers = test.submitted_answers;
        const correct = answers.filter((a) => a.is_correct === true).length;
        const totalQuestions =
          test.test_suite?.questions?.length ?? answers.length;
        const score = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;

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

    await this.cacheManager.set(cacheKey, result, ttl);
    return result;
  }

  async changeStudentPassword({
    id,
    currentPassword,
    newPassword,
  }: {
    id: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<StudentTypeClass> {
    const student = await this.studentRepository.findOne({ where: { id } });

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

  async listCourseSuitesPaginated({
    id,
    courseId,
    suiteTypes,
    pagination,
  }: {
    id: string;
    courseId: string;
    suiteTypes?: SuiteType[];
    pagination?: PaginationInput;
  }) {
    const student = await this.studentRepository.findOne({
      where: { id, subscribed_courses: { id: courseId } },
    });

    if (!student) {
      throw new NotFoundException(
        'Student not found or not subscribed to this course',
      );
    }

    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['approved_version.test_suites'],
    });

    if (!course?.approved_version) {
      throw new NotFoundException('Course or approved version not found');
    }

    let suites = course.approved_version.test_suites ?? [];

    if (suiteTypes?.length) {
      suites = suites.filter((s) => suiteTypes.includes(s.suite_type));
    }

    return PaginateHelper.paginate<TestSuite>(suites, pagination, (s) => s.id);
  }

  async getCurrentStreakCount({
    id,
  }: {
    id: string;
  }): Promise<{ current_streak: number; best_streak: number }> {
    const cacheKey = `student-streak:${id}`;
    const cached = await this.cacheManager.get<{
      current_streak: number;
      best_streak: number;
    }>(cacheKey);
    if (cached) return cached;

    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['tests.time_events'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const endedTests = student.tests.filter(
      (t) => t.status === TestStatusType.ENDED,
    );

    const getTestStartTime = (test: Test): Date | null => {
      const event = test.time_events.find(
        (e) => e.type === TimeEventType.STARTED,
      );
      return event ? new Date(event.recorded_at) : null;
    };

    const { current, best } = this.computeStreaks(endedTests, getTestStartTime);

    const result = { current_streak: current, best_streak: best };
    await this.cacheManager.set(cacheKey, result, SEVEN_DAYS_MS);
    return result;
  }

  private computeStreaks(
    tests: Test[],
    getStartTime: (test: Test) => Date | null,
  ): { current: number; best: number } {
    const days = new Set<string>();

    for (const test of tests) {
      const start = getStartTime(test);
      if (start) {
        days.add(start.toISOString().split('T')[0]);
      }
    }

    if (days.size === 0) return { current: 0, best: 0 };

    const sortedDays = Array.from(days).sort();

    let bestStreak = 1;
    let runStreak = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const prev = new Date(sortedDays[i - 1]);
      const curr = new Date(sortedDays[i]);
      const diffDays = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 1) {
        runStreak++;
        bestStreak = Math.max(bestStreak, runStreak);
      } else {
        runStreak = 1;
      }
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const lastDay = sortedDays[sortedDays.length - 1];
    let currentStreak = 0;

    if (lastDay === todayStr || lastDay === yesterdayStr) {
      currentStreak = 1;
      for (let i = sortedDays.length - 2; i >= 0; i--) {
        const curr = new Date(sortedDays[i + 1]);
        const prev = new Date(sortedDays[i]);
        const diffDays = Math.round(
          (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return { current: currentStreak, best: bestStreak };
  }

  async getCategoryCountdown({
    categoryId,
  }: {
    categoryId: string;
  }): Promise<CategoryCountdownResponse> {
    const category = await this.studentRepository.manager.findOne(Category, {
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category does not exist');
    }

    let countdown: number | null = null;
    if (category.date_of_exams) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const examDate = new Date(category.date_of_exams);
      examDate.setHours(0, 0, 0, 0);
      countdown = Math.round(
        (examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    return {
      categoryName: category.name,
      countdown,
      exam_duration_days: category.exam_duration_days ?? null,
    };
  }

  private getTestStartTime(test: Test): Date | null {
    const event = test.time_events.find(
      (e) => e.type === TimeEventType.STARTED,
    );
    return event ? new Date(event.recorded_at) : null;
  }

  private computeScorePercentage(test: Test): number {
    const answers = test.submitted_answers;
    const totalQuestions = test.test_suite?.questions?.length ?? answers.length;
    if (!totalQuestions) return 0;
    const correct = answers.filter((a) => a.is_correct === true).length;
    return (correct / totalQuestions) * 100;
  }

  async getStudentAggregate({
    id,
    categoryId,
  }: {
    id: string;
    categoryId?: string;
  }): Promise<StudentAggregateResponse> {
    const cacheKey = `student-aggregate:${id}`;

    if (!categoryId) {
      const cached =
        await this.cacheManager.get<StudentAggregateResponse>(cacheKey);
      if (cached) {
        return {
          ...cached,
          courses_with_test_taken: cached.courses_with_test_taken.map(
            (course) => ({
              ...course,
              date_taken: course.date_taken
                ? new Date(course.date_taken)
                : null,
            }),
          ),
        };
      }
    }

    const student = await this.studentRepository.findOne({
      where: { id },
      relations: [
        'subscribed_courses',
        'subscribed_categories.courses',
        'tests.test_suite.course_version.course',
        'tests.test_suite.questions',
        'tests.submitted_answers',
        'tests.time_events',
      ],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const category = categoryId
      ? student.subscribed_categories.find((c) => c.id === categoryId)
      : student.subscribed_categories[0];

    if (!category) {
      throw new NotFoundException(
        'Student is not subscribed to this category',
      );
    }

    const subscribedCourseIds = new Set(
      student.subscribed_courses.map((c) => c.id),
    );
    const categoryCourses = category.courses.filter((c) =>
      subscribedCourseIds.has(c.id),
    );

    const endedTests = student.tests.filter(
      (t) => t.status === TestStatusType.ENDED,
    );
    // .filter((t) => t.test_suite?.suite_type === SuiteType.PAST_QUESTIONS) // enable once past-questions-only aggregate is required

    const strategy = GRADING_STRATEGIES[category.grading_system];

    const coursesWithTestTaken: CourseAggregateEntry[] = [];
    const coursesWithoutTestTaken: CourseAggregateEntry[] = [];
    const gradedCourses: GradedCourse[] = [];

    for (const course of categoryCourses) {
      const latestTest = endedTests
        .filter((t) => t.test_suite?.course_version?.course?.id === course.id)
        .sort(
          (a, b) =>
            (this.getTestStartTime(b)?.getTime() ?? 0) -
            (this.getTestStartTime(a)?.getTime() ?? 0),
        )[0];

      if (!latestTest) {
        coursesWithoutTestTaken.push({
          course_id: course.id,
          course_title: course.title,
          is_mandatory: course.is_mandatory,
          score: null,
          grade: null,
          date_taken: null,
        });
        continue;
      }

      const score = this.computeScorePercentage(latestTest);
      const grade = strategy ? strategy.getGrade(score).grade : null;

      coursesWithTestTaken.push({
        course_id: course.id,
        course_title: course.title,
        is_mandatory: course.is_mandatory,
        score,
        grade,
        date_taken: this.getTestStartTime(latestTest),
      });

      gradedCourses.push({
        course_id: course.id,
        course_title: course.title,
        is_mandatory: course.is_mandatory,
        score,
      });
    }

    const aggregate = strategy
      ? computeAggregateRange(strategy, gradedCourses)
      : null;

    const requiredSlots = strategy
      ? strategy.coreCount + strategy.electiveCount
      : 0;

    let state: StudentAggregateStateType;
    if (coursesWithTestTaken.length === 0) {
      state = StudentAggregateStateType.ZERO_DATA;
    } else if (
      aggregate &&
      aggregate.requiredCoreRemaining === 0 &&
      aggregate.requiredElectiveRemaining === 0
    ) {
      state = StudentAggregateStateType.COMPLETE_DATA;
    } else {
      state = StudentAggregateStateType.PARTIAL_DATA;
    }

    const missingCourseTitles: string[] = [];
    if (aggregate) {
      const untestedCore = coursesWithoutTestTaken.filter(
        (c) => c.is_mandatory,
      );
      const untestedElective = coursesWithoutTestTaken.filter(
        (c) => !c.is_mandatory,
      );
      missingCourseTitles.push(
        ...untestedCore
          .slice(0, aggregate.requiredCoreRemaining)
          .map((c) => c.course_title),
        ...untestedElective
          .slice(0, aggregate.requiredElectiveRemaining)
          .map((c) => c.course_title),
      );
    }

    const message = buildAggregateMessage({
      state: state as unknown as AggregateState,
      gradingConfigured: strategy !== null,
      missingCourseTitles,
      requiredSlots,
    });

    const result: StudentAggregateResponse = {
      state,
      message,
      aggregate_range: aggregate?.range ?? null,
      required_subjects_count: requiredSlots,
      tested_required_subjects_count: aggregate?.testedSlots ?? 0,
      category_id: category.id,
      category_name: category.name,
      grading_system: category.grading_system,
      courses_with_test_taken: coursesWithTestTaken,
      courses_without_test_taken: coursesWithoutTestTaken,
    };

    if (!categoryId) {
      await this.cacheManager.set(cacheKey, result, SEVEN_DAYS_MS);
    }

    return result;
  }
}
