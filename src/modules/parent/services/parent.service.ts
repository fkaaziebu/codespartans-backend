import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { HashHelper, PaginateHelper } from 'src/helpers';
import { PaginationInput } from 'src/helpers/inputs';
import { TimeEventType } from 'src/modules/simulation/entities/time_event.entity';
import { TestStatusType } from 'src/modules/simulation/entities/test.entity';
import { SubjectProgressResponse } from 'src/modules/inventory/types/subject-progress-response.type';
import { WeakSubjectAreaResponse } from 'src/modules/inventory/types/weak-subject-area-response.type';
import {
  AttemptConnection,
  AttemptResponse,
} from 'src/modules/inventory/types';
import { Test } from 'src/modules/simulation/entities/test.entity';
import {
  TestAssignment,
  TestAssignmentStatus,
} from 'src/modules/simulation/entities/test_assignment.entity';
import { TestSuite } from 'src/modules/review/entities/test_suite.entity';
import { Student } from 'src/modules/auth/entities/student.entity';
import { Organization } from 'src/modules/auth/entities/organization.entity';
import { Cart } from 'src/modules/inventory/entities/cart.entity';
import { Category } from 'src/modules/inventory/entities/category.entity';
import { EmailProducer } from '../../auth/services/email.producer';
import { Child, ClassLevel } from '../entities/child.entity';
import { Parent } from '../entities/parent.entity';
import {
  ActivityConnection,
  ChildStatsResponse,
  LoginChildResponse,
  LoginParentResponse,
  SetupChildResult,
  StreakResponse,
  VerifyChildUsernameResponse,
} from '../types';

@Injectable()
export class ParentService {
  constructor(
    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,
    @InjectRepository(Child)
    private childRepository: Repository<Child>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(TestAssignment)
    private testAssignmentRepository: Repository<TestAssignment>,
    @InjectRepository(TestSuite)
    private testSuiteRepository: Repository<TestSuite>,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailProducer: EmailProducer,
  ) {}

  async registerParent({
    first_name,
    last_name,
    email,
    whatsapp_number,
    password,
  }: {
    first_name: string;
    last_name: string;
    email: string;
    whatsapp_number: string;
    password: string;
  }): Promise<{ message: string }> {
    return this.parentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const existing = await transactionalEntityManager.findOne(Parent, {
          where: { email },
        });

        if (existing) {
          throw new BadRequestException(
            'An account with this email already exists',
          );
        }

        const validationCode = Math.floor(
          100000 + Math.random() * 900000,
        ).toString();

        const parent = new Parent();
        parent.first_name = first_name;
        parent.last_name = last_name;
        parent.email = email;
        parent.whatsapp_number = whatsapp_number;
        parent.password = await HashHelper.encrypt(password);
        parent.is_account_validated = false;
        parent.is_setup_completed = false;
        parent.validation_code = validationCode;

        await transactionalEntityManager.save(Parent, parent);

        await this.emailProducer.sendAccountValidationEmail({
          email,
          name: `${first_name} ${last_name}`,
          validationCode,
        });

        return {
          message: 'Registration successful. Please verify your email.',
        };
      },
    );
  }

  async refreshParentToken(
    refresh_token: string,
  ): Promise<{ access_token: string }> {
    let payload: {
      id: string;
      name: string;
      email: string;
      role: 'PARENT';
      type: string;
    };

    try {
      payload = this.jwtService.verify(refresh_token);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh' || payload.role !== 'PARENT') {
      throw new UnauthorizedException('Invalid token type');
    }

    const { type: _type, ...tokenPayload } = payload;
    const access_token = this.jwtService.sign(tokenPayload);
    return { access_token };
  }

  async resendParentAccountValidationCode(
    email: string,
  ): Promise<{ message: string }> {
    return this.parentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const parent = await transactionalEntityManager.findOne(Parent, {
          where: { email },
        });

        if (!parent) {
          throw new NotFoundException('Parent not found');
        }

        if (parent.is_account_validated) {
          throw new BadRequestException('Account is already verified');
        }

        const validationCode = Math.floor(
          100000 + Math.random() * 900000,
        ).toString();

        parent.validation_code = validationCode;
        await transactionalEntityManager.save(Parent, parent);

        await this.emailProducer.sendAccountValidationEmail({
          email,
          name: `${parent.first_name} ${parent.last_name}`,
          validationCode,
        });

        return { message: 'Verification email resent successfully' };
      },
    );
  }

  async verifyParentAccount({
    email,
    code,
  }: {
    email: string;
    code: string;
  }): Promise<{ message: string }> {
    return this.parentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const parent = await transactionalEntityManager.findOne(Parent, {
          where: { email },
        });

        if (!parent) {
          throw new NotFoundException('Parent not found');
        }

        if (parent.is_account_validated) {
          throw new BadRequestException('Account is already verified');
        }

        if (parent.validation_code !== code) {
          throw new BadRequestException('Invalid verification code');
        }

        parent.is_account_validated = true;
        parent.validation_code = null;

        await transactionalEntityManager.save(Parent, parent);

        return { message: 'Account verified successfully' };
      },
    );
  }

  async loginParent({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<LoginParentResponse> {
    return this.parentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const parent = await transactionalEntityManager.findOne(Parent, {
          where: { email },
        });

        if (!parent) {
          throw new BadRequestException('Email or password is incorrect');
        }

        const isPasswordValid = await HashHelper.compare(
          password,
          parent.password,
        );

        if (!isPasswordValid) {
          throw new BadRequestException('Email or password is incorrect');
        }

        if (!parent.is_account_validated) {
          throw new BadRequestException(
            'Account not verified. Please check your email for the verification code.',
          );
        }

        const payload = {
          id: parent.id,
          name: `${parent.first_name} ${parent.last_name}`,
          email: parent.email,
          role: 'PARENT' as const,
        };

        const token = this.jwtService.sign(payload);
        const refresh_token = this.jwtService.sign(
          { ...payload, type: 'refresh' },
          { expiresIn: '30d' },
        );

        return { ...parent, token, refresh_token };
      },
    );
  }

  async setupParentAccount(
    parentEmail: string,
    children: Array<{
      full_name: string;
      class_level: ClassLevel;
      target_exam: string;
      school_name?: string;
    }>,
  ): Promise<SetupChildResult[]> {
    return this.parentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const parent = await transactionalEntityManager.findOne(Parent, {
          where: { email: parentEmail },
        });

        if (!parent) {
          throw new NotFoundException('Parent not found');
        }

        if (!parent.is_account_validated) {
          throw new UnauthorizedException(
            'Please verify your account before setting up',
          );
        }

        const results: SetupChildResult[] = [];

        for (const childData of children) {
          const category = await transactionalEntityManager.findOne(Category, {
            where: { id: childData.target_exam },
            relations: ['courses'],
          });

          if (!category) {
            throw new NotFoundException(
              `Category with id ${childData.target_exam} not found`,
            );
          }

          const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
          const username = await this.generateUniqueUsername(
            childData.full_name,
            transactionalEntityManager,
          );

          const organization = await transactionalEntityManager.findOne(
            Organization,
            { where: { email: this.configService.get('GENPOP_EMAIL') } },
          );

          if (!organization) {
            throw new NotFoundException('Default organization not found');
          }

          const cart = new Cart();
          await transactionalEntityManager.save(Cart, cart);

          const student = new Student();
          student.name = childData.full_name;
          student.email = `${username}@child.local`;
          student.password = await HashHelper.encrypt(rawPin);
          student.is_account_validated = true;
          student.is_setup_completed = true;
          student.cart = cart;
          student.organizations = [organization];
          student.subscribed_categories = [category];
          student.subscribed_courses = category.courses ?? [];

          await transactionalEntityManager.save(student);

          const child = new Child();
          child.full_name = childData.full_name;
          child.class_level = childData.class_level;
          child.target_exam = childData.target_exam;
          child.school_name = childData.school_name;
          child.username = username;
          child.pin = await HashHelper.encrypt(rawPin);
          child.parent = parent;
          child.student = student;

          await transactionalEntityManager.save(child);

          results.push({
            full_name: childData.full_name,
            username,
            pin: rawPin,
          });
        }

        parent.is_setup_completed = true;
        await transactionalEntityManager.save(parent);

        return results;
      },
    );
  }

  async addChild(
    parentEmail: string,
    {
      full_name,
      class_level,
      target_exam,
      school_name,
    }: {
      full_name: string;
      class_level: ClassLevel;
      target_exam: string;
      school_name?: string;
    },
  ): Promise<{ message: string; pin: string }> {
    return this.parentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const parent = await transactionalEntityManager.findOne(Parent, {
          where: { email: parentEmail },
        });

        if (!parent) {
          throw new NotFoundException('Parent not found');
        }

        if (!parent.is_account_validated) {
          throw new UnauthorizedException(
            'Please verify your account before adding children',
          );
        }

        const category = await transactionalEntityManager.findOne(Category, {
          where: { id: target_exam },
          relations: ['courses'],
        });

        if (!category) {
          throw new NotFoundException(
            `Category with id ${target_exam} not found`,
          );
        }

        const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
        const username = await this.generateUniqueUsername(
          full_name,
          transactionalEntityManager,
        );

        const organization = await transactionalEntityManager.findOne(
          Organization,
          { where: { email: this.configService.get('GENPOP_EMAIL') } },
        );

        if (!organization) {
          throw new NotFoundException('Default organization not found');
        }

        const cart = new Cart();
        await transactionalEntityManager.save(Cart, cart);

        const student = new Student();
        student.name = full_name;
        student.email = `${username}@child.local`;
        student.password = await HashHelper.encrypt(rawPin);
        student.is_account_validated = true;
        student.is_setup_completed = true;
        student.cart = cart;
        student.organizations = [organization];
        student.subscribed_categories = [category];
        student.subscribed_courses = category.courses ?? [];

        await transactionalEntityManager.save(Student, student);

        const child = new Child();
        child.full_name = full_name;
        child.class_level = class_level;
        child.target_exam = target_exam;
        child.school_name = school_name;
        child.username = username;
        child.pin = await HashHelper.encrypt(rawPin);
        child.parent = parent;
        child.student = student;

        await transactionalEntityManager.save(Child, child);

        return {
          message: 'Child added successfully',
          pin: rawPin,
        };
      },
    );
  }

  async resetChildPin(
    parentEmail: string,
    childId: string,
  ): Promise<{ message: string; pin: string }> {
    return this.parentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const child = await transactionalEntityManager.findOne(Child, {
          where: { id: childId, parent: { email: parentEmail } },
          relations: ['student'],
        });

        if (!child) {
          throw new NotFoundException('Child not found');
        }

        const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
        const hashed = await HashHelper.encrypt(rawPin);

        child.pin = hashed;
        await transactionalEntityManager.save(Child, child);

        if (child.student) {
          child.student.password = hashed;
          await transactionalEntityManager.save(Student, child.student);
        }

        return { message: 'Pin reset successfully', pin: rawPin };
      },
    );
  }

  async shareChildLogin(
    parentEmail: string,
    childId: string,
  ): Promise<{ message: string }> {
    return this.childRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const child = await transactionalEntityManager.findOne(Child, {
          where: { id: childId, parent: { email: parentEmail } },
          relations: ['student'],
        });

        if (!child) {
          throw new NotFoundException('Child not found');
        }

        const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
        const hashed = await HashHelper.encrypt(rawPin);

        child.pin = hashed;
        await transactionalEntityManager.save(Child, child);

        if (child.student) {
          child.student.password = hashed;
          await transactionalEntityManager.save(Student, child.student);
        }

        const studentUrl = this.configService.get<string>(
          'STUDENT_URL',
          'http://localhost:3000',
        );
        const message = `Hi! Here are ${child.full_name}'s ExamForge login details: Username: ${child.username} PIN: ${rawPin} Login at: ${studentUrl}/child-login`;

        return { message };
      },
    );
  }

  async listOrganizationCategories(searchTerm?: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: {
        organization: {
          email: this.configService.get('GENPOP_EMAIL'),
        },
        ...(searchTerm ? { name: ILike(`%${searchTerm.trim()}%`) } : {}),
      },
      relations: ['courses.approved_version.test_suites'],
    });
  }

  async listChildren(parentEmail: string, pagination?: PaginationInput) {
    return this.parentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const parent = await transactionalEntityManager.findOne(Parent, {
          where: { email: parentEmail },
          relations: ['children.student.subscribed_categories'],
        });

        if (!parent) {
          throw new NotFoundException('Parent not found');
        }

        return PaginateHelper.paginate<Child>(
          parent.children,
          pagination,
          (child) => child.id,
        );
      },
    );
  }

  async getChildStats(
    parentEmail: string,
    childId: string,
  ): Promise<ChildStatsResponse> {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { email: parentEmail } },
      relations: [
        'student.tests.submitted_answers.question',
        'student.tests.time_events',
      ],
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    if (!child.student) {
      return {
        avg_score: 0,
        avg_score_percent_diff: 0,
        current_streak_count: 0,
        best_streak_count: 0,
        total_questions_done: 0,
        total_questions_percent_diff: 0,
        sessions_this_week: 0,
      };
    }

    const endedTests = child.student.tests.filter(
      (t) => t.status === TestStatusType.ENDED,
    );

    const getTestStartTime = (test: Test): Date | null => {
      const event = test.time_events.find(
        (e) => e.type === TimeEventType.STARTED,
      );
      return event ? new Date(event.recorded_at) : null;
    };

    const computeScore = (test: Test): number => {
      const answers = test.submitted_answers;
      if (!answers.length) return 0;
      const correct = answers.filter((a) => a.is_correct === true).length;
      return (correct / answers.length) * 100;
    };

    const computeAverage = (tests: Test[]): number => {
      if (!tests.length) return 0;
      return tests.reduce((sum, t) => sum + computeScore(t), 0) / tests.length;
    };

    const computePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = thisMonthStart;

    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = thisWeekStart;

    const thisMonthTests = endedTests.filter((t) => {
      const start = getTestStartTime(t);
      return start && start >= thisMonthStart;
    });

    const lastMonthTests = endedTests.filter((t) => {
      const start = getTestStartTime(t);
      return start && start >= lastMonthStart && start < lastMonthEnd;
    });

    const thisWeekTests = endedTests.filter((t) => {
      const start = getTestStartTime(t);
      return start && start >= thisWeekStart;
    });

    const lastWeekTests = endedTests.filter((t) => {
      const start = getTestStartTime(t);
      return start && start >= lastWeekStart && start < lastWeekEnd;
    });

    const thisWeekQuestions = thisWeekTests.reduce(
      (sum, t) => sum + t.submitted_answers.length,
      0,
    );
    const lastWeekQuestions = lastWeekTests.reduce(
      (sum, t) => sum + t.submitted_answers.length,
      0,
    );

    const { current, best } = this.computeStreaks(endedTests, getTestStartTime);

    return {
      avg_score: computeAverage(endedTests),
      avg_score_percent_diff: computePercentageChange(
        computeAverage(thisMonthTests),
        computeAverage(lastMonthTests),
      ),
      current_streak_count: current,
      best_streak_count: best,
      total_questions_done: endedTests.reduce(
        (sum, t) => sum + t.submitted_answers.length,
        0,
      ),
      total_questions_percent_diff: computePercentageChange(
        thisWeekQuestions,
        lastWeekQuestions,
      ),
      sessions_this_week: thisWeekTests.length,
    };
  }

  async getChildSubjectProgress(
    parentEmail: string,
    childId: string,
    courseId?: string,
  ): Promise<SubjectProgressResponse[]> {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { email: parentEmail } },
      relations: [
        'student.tests.submitted_answers',
        'student.tests.test_suite.course_version.course',
        'student.tests.time_events',
      ],
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    if (!child.student) return [];

    const RECENT_TEST_CAP = 10;

    const endedTests = child.student.tests.filter((t) => {
      if (t.status !== TestStatusType.ENDED) return false;
      if (courseId) {
        return t.test_suite?.course_version?.course?.id === courseId;
      }
      return true;
    });

    const recentTests = endedTests
      .map((t) => {
        const startEvent = t.time_events?.find(
          (e) => e.type === TimeEventType.STARTED,
        );
        return { test: t, startedAt: startEvent?.recorded_at ?? new Date(0) };
      })
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, RECENT_TEST_CAP)
      .map((x) => x.test);

    const courseStats = new Map<
      string,
      { sessions: number; correct: number; wrong: number }
    >();

    for (const test of recentTests) {
      const courseTitle = test.test_suite?.course_version?.course?.title;
      if (!courseTitle) continue;

      const stat = courseStats.get(courseTitle) ?? {
        sessions: 0,
        correct: 0,
        wrong: 0,
      };
      stat.sessions += 1;

      for (const answer of test.submitted_answers) {
        if (answer.is_correct === true) stat.correct += 1;
        else stat.wrong += 1;
      }

      courseStats.set(courseTitle, stat);
    }

    return Array.from(courseStats.entries()).map(([subject, stat]) => {
      const totalAnswers = stat.correct + stat.wrong;
      return {
        subject,
        total: stat.sessions,
        correct: stat.correct,
        wrong: stat.wrong,
        score: totalAnswers > 0 ? (stat.correct / totalAnswers) * 100 : 0,
      };
    });
  }

  async getChildTestsHistory(
    parentEmail: string,
    childId: string,
    pagination?: PaginationInput,
  ): Promise<AttemptConnection> {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { email: parentEmail } },
      relations: [
        'student.tests.test_suite.course_version.course',
        'student.tests.submitted_answers.question',
        'student.tests.time_events',
      ],
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    if (!child.student) {
      return PaginateHelper.paginate<AttemptResponse>(
        [],
        pagination,
        (t) => t.id,
      );
    }

    const endedTests = child.student.tests.filter(
      (t) => t.status === TestStatusType.ENDED,
    );

    const computeScore = (test: Test): number => {
      const answers = test.submitted_answers;
      if (!answers.length) return 0;
      const correct = answers.filter((a) => a.is_correct === true).length;
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

    const enriched = endedTests.map((test) => {
      const answers = test.submitted_answers;
      const correct = answers.filter((a) => a.is_correct === true).length;
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

    const getCourseId = (t: (typeof enriched)[number]) =>
      t.test_suite?.course_version?.course?.id;

    for (const attempt of enriched) {
      const cid = getCourseId(attempt);
      if (!cid || !attempt.date_taken) continue;
      const sameCourse = enriched
        .filter((a) => getCourseId(a) === cid && a.date_taken)
        .sort((a, b) => a.date_taken.getTime() - b.date_taken.getTime());
      const idx = sameCourse.findIndex((a) => a.id === attempt.id);
      if (idx > 0) {
        attempt.trend = attempt.score - sameCourse[idx - 1].score;
      }
    }

    enriched.sort((a, b) => {
      if (!a.date_taken) return 1;
      if (!b.date_taken) return -1;
      return b.date_taken.getTime() - a.date_taken.getTime();
    });

    return PaginateHelper.paginate<AttemptResponse>(
      enriched as AttemptResponse[],
      pagination,
      (t) => t.id,
    );
  }

  async getChildWeakAreas(
    parentEmail: string,
    childId: string,
  ): Promise<WeakSubjectAreaResponse[]> {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { email: parentEmail } },
      relations: [
        'student.tests.submitted_answers.question',
        'student.tests.test_suite.questions',
        'student.tests.time_events',
      ],
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    if (!child.student) return [];

    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const endedTests = child.student.tests.filter((t) => {
      if (t.status !== TestStatusType.ENDED) return false;
      const startEvent = t.time_events?.find(
        (e) => e.type === TimeEventType.STARTED,
      );
      if (!startEvent) return false;
      return new Date(startEvent.recorded_at) >= fourWeeksAgo;
    });

    const tagStats = new Map<
      string,
      {
        error_count: number;
        total: number;
        questions: Map<string, any>;
      }
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
            if (answer.question) {
              stat.questions.set(answer.question.id, answer.question);
            }
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

    return Array.from(tagStats.entries())
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
  }

  async getChildActivity(
    parentEmail: string,
    childId: string,
    pagination?: PaginationInput,
  ): Promise<ActivityConnection> {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { email: parentEmail } },
      relations: [
        'student.tests.submitted_answers.question',
        'student.tests.time_events',
        'student.tests.test_suite.course_version.course',
      ],
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    if (!child.student) {
      return PaginateHelper.paginate([], pagination, (a: any) =>
        a.activity_date.toISOString(),
      );
    }

    const endedTests = child.student.tests.filter(
      (t) => t.status === TestStatusType.ENDED,
    );

    const activities = endedTests
      .map((test) => {
        const startEvent = test.time_events.find(
          (e) => e.type === TimeEventType.STARTED,
        );
        if (!startEvent) return null;

        const answers = test.submitted_answers;
        const correct = answers.filter((a) => a.is_correct === true).length;
        const score = answers.length > 0 ? (correct / answers.length) * 100 : 0;
        const course_title =
          test.test_suite?.course_version?.course?.title ?? undefined;

        return {
          activity_date: new Date(startEvent.recorded_at),
          score,
          questions_done: answers.length,
          course_title,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.activity_date.getTime() - a.activity_date.getTime());

    return PaginateHelper.paginate(activities, pagination, (a) =>
      a.activity_date.toISOString(),
    );
  }

  async getChildStreak(
    parentEmail: string,
    childId: string,
  ): Promise<StreakResponse> {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { email: parentEmail } },
      relations: ['student.tests.time_events'],
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    if (!child.student) {
      return { current_streak: 0, best_streak: 0 };
    }

    const endedTests = child.student.tests.filter(
      (t) => t.status === TestStatusType.ENDED,
    );

    const getTestStartTime = (test: Test): Date | null => {
      const event = test.time_events.find(
        (e) => e.type === TimeEventType.STARTED,
      );
      return event ? new Date(event.recorded_at) : null;
    };

    const { current, best } = this.computeStreaks(endedTests, getTestStartTime);

    return { current_streak: current, best_streak: best };
  }

  async listChildStreak(
    parentEmail: string,
    childId: string,
    month: number,
    year: number,
  ): Promise<{ date: string; is_active: boolean }[]> {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { email: parentEmail } },
      relations: ['student.tests.time_events'],
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    const dateCounts = new Map<string, number>();

    if (child.student) {
      const endedTests = child.student.tests.filter(
        (t) => t.status === TestStatusType.ENDED,
      );

      for (const test of endedTests) {
        const event = test.time_events.find(
          (e) => e.type === TimeEventType.STARTED,
        );
        if (!event) continue;
        const d = new Date(event.recorded_at);
        if (d.getFullYear() === year && d.getMonth() + 1 === month) {
          const dateStr = d.toISOString().split('T')[0];
          dateCounts.set(dateStr, (dateCounts.get(dateStr) ?? 0) + 1);
        }
      }
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const result: { date: string; is_active: boolean; count: number }[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const count = dateCounts.get(date) ?? 0;
      result.push({ date, is_active: count > 0, count });
    }

    return result;
  }

  async verifyChildUsername(
    username: string,
  ): Promise<VerifyChildUsernameResponse> {
    const child = await this.childRepository.findOne({ where: { username } });

    if (!child) {
      throw new NotFoundException('Username not found');
    }

    const payload = {
      id: child.id,
      username: child.username,
      role: 'CHILD' as const,
      type: 'temp',
    };

    const temp_token = this.jwtService.sign(payload, { expiresIn: '5m' });

    return { temp_token };
  }

  async loginChild(
    temp_token: string,
    pin: string,
  ): Promise<LoginChildResponse> {
    let payload: { id: string; username: string; role: string; type: string };

    try {
      payload = this.jwtService.verify(temp_token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.type !== 'temp' || payload.role !== 'CHILD') {
      throw new UnauthorizedException('Invalid token type');
    }

    const child = await this.childRepository.findOne({
      where: { id: payload.id },
      relations: ['student.organizations'],
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    const isPinValid = await HashHelper.compare(pin, child.pin);

    if (!isPinValid) {
      throw new UnauthorizedException('Invalid pin');
    }

    const tokenPayload = {
      id: child.student.id,
      name: child.student.name,
      email: child.student.email,
      role: 'CHILD' as const,
    };

    const token = this.jwtService.sign(tokenPayload);
    const refresh_token = this.jwtService.sign(
      { ...tokenPayload, type: 'refresh' },
      { expiresIn: '30d' },
    );

    return { ...child, token, refresh_token };
  }

  async assignTestToChild(
    parentEmail: string,
    childId: string,
    suiteId: string,
  ): Promise<TestAssignment> {
    return this.parentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const child = await transactionalEntityManager.findOne(Child, {
          where: { id: childId, parent: { email: parentEmail } },
          relations: ['parent'],
        });

        if (!child) {
          throw new NotFoundException('Child not found');
        }

        const testSuite = await transactionalEntityManager.findOne(TestSuite, {
          where: { id: suiteId },
        });

        if (!testSuite) {
          throw new NotFoundException('Test suite not found');
        }

        const assignment = new TestAssignment();
        assignment.parent = child.parent;
        assignment.child = child;
        assignment.test_suite = testSuite;
        assignment.status = TestAssignmentStatus.PENDING;

        return transactionalEntityManager.save(TestAssignment, assignment);
      },
    );
  }

  async listChildAssignments(
    parentEmail: string,
    childId: string,
  ): Promise<TestAssignment[]> {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { email: parentEmail } },
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    return this.testAssignmentRepository.find({
      where: { child: { id: childId } },
      relations: ['test_suite', 'test'],
      order: { assigned_at: 'DESC' },
    });
  }

  async listParentAlerts(
    parentEmail: string,
  ): Promise<
    {
      id: string;
      alert_type: string;
      icon: string;
      icon_bg: string;
      title: string;
      description: string;
      time_label: string;
      is_unread: boolean;
      actions: { label: string; variant: string; href: string }[];
    }[]
  > {
    const parent = await this.parentRepository.findOne({
      where: { email: parentEmail },
      relations: [
        'children.student.tests.submitted_answers.question',
        'children.student.tests.time_events',
        'children.student.tests.test_suite.course_version.course',
      ],
    });

    if (!parent) throw new NotFoundException('Parent not found');

    const now = new Date();
    const alerts: {
      id: string;
      alert_type: string;
      icon: string;
      icon_bg: string;
      title: string;
      description: string;
      time_label: string;
      is_unread: boolean;
      actions: { label: string; variant: string; href: string }[];
      sort_ts: number;
    }[] = [];

    const formatTimeLabel = (date: Date): string => {
      const diffMs = now.getTime() - date.getTime();
      const diffH = Math.floor(diffMs / (1000 * 60 * 60));
      const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffH < 1) return 'Just now';
      if (diffH < 24) return `${diffH} hour${diffH > 1 ? 's' : ''} ago`;
      if (diffD === 1) {
        const hhmm = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });
        return `Yesterday, ${hhmm}`;
      }
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    };

    const getTestStartTime = (test: Test): Date | null => {
      const event = test.time_events.find(
        (e) => e.type === TimeEventType.STARTED,
      );
      return event ? new Date(event.recorded_at) : null;
    };

    const computeScore = (test: Test): number => {
      const answers = test.submitted_answers;
      if (!answers.length) return 0;
      return (
        (answers.filter((a) => a.is_correct === true).length / answers.length) *
        100
      );
    };

    for (const child of parent.children) {
      const firstName = child.full_name.split(' ')[0];
      const endedTests = (child.student?.tests ?? []).filter(
        (t) => t.status === TestStatusType.ENDED,
      );

      const testsByTime = [...endedTests]
        .map((t) => ({ test: t, start: getTestStartTime(t) }))
        .filter((x) => x.start !== null)
        .sort((a, b) => b.start!.getTime() - a.start!.getTime());

      const lastActivity = testsByTime[0]?.start ?? null;
      const daysSinceActivity = lastActivity
        ? Math.floor(
            (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24),
          )
        : null;

      if (daysSinceActivity !== null && daysSinceActivity >= 2) {
        const alertDate = lastActivity!;
        const isNew = daysSinceActivity < 3;
        alerts.push({
          id: `inactivity-${child.id}`,
          alert_type: 'warning',
          icon: '📉',
          icon_bg: '#FAEEDA',
          title: `${firstName} hasn't studied in ${daysSinceActivity} day${daysSinceActivity > 1 ? 's' : ''}`,
          description: `Their study streak is at risk. A gentle reminder could help them get back on track today.`,
          time_label: formatTimeLabel(alertDate),
          is_unread: isNew,
          actions: [
            { label: 'Assign Test', variant: 'primary', href: 'assign-test' },
            { label: 'Dismiss', variant: 'secondary', href: 'dismiss' },
          ],
          sort_ts: alertDate.getTime(),
        });
      }

      if (testsByTime.length > 0) {
        const { test: latestTest, start: latestStart } = testsByTime[0];
        const score = computeScore(latestTest);

        if (score < 60 && score > 0) {
          const courseName =
            latestTest.test_suite?.course_version?.course?.title ?? 'last test';
          const isNew =
            latestStart !== null &&
            now.getTime() - latestStart!.getTime() < 2 * 24 * 60 * 60 * 1000;
          alerts.push({
            id: `low-score-${child.id}-${latestTest.id}`,
            alert_type: 'warning',
            icon: '⚠️',
            icon_bg: '#FAEEDA',
            title: `${firstName}'s ${courseName} score dropped to ${Math.round(score)}%`,
            description: `This is below their usual average. Check their weak areas to see which topics need more practice.`,
            time_label: formatTimeLabel(latestStart!),
            is_unread: isNew,
            actions: [
              { label: 'View weak areas', variant: 'primary', href: 'weak-areas' },
              { label: 'Dismiss', variant: 'secondary', href: 'dismiss' },
            ],
            sort_ts: latestStart!.getTime(),
          });
        }
      }

      if (
        testsByTime.length >= 1 &&
        testsByTime[0].start !== null &&
        now.getTime() - testsByTime[0].start!.getTime() < 48 * 60 * 60 * 1000
      ) {
        const recentTest = testsByTime[0];
        const courseName =
          recentTest.test.test_suite?.course_version?.course?.title ??
          'a subject';
        const score = computeScore(recentTest.test);
        if (score >= 60) {
          alerts.push({
            id: `completed-${child.id}-${recentTest.test.id}`,
            alert_type: 'info',
            icon: '🏆',
            icon_bg: '#E1F5EE',
            title: `${firstName} completed a ${courseName} session`,
            description: `${firstName} scored ${Math.round(score)}% — great work! Keep up the momentum.`,
            time_label: formatTimeLabel(recentTest.start!),
            is_unread:
              now.getTime() - recentTest.start!.getTime() <
              24 * 60 * 60 * 1000,
            actions: [
              {
                label: 'View trends',
                variant: 'primary',
                href: 'trends',
              },
            ],
            sort_ts: recentTest.start!.getTime(),
          });
        }
      }
    }

    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevMonthYear =
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const reportDate = new Date(prevMonthYear, prevMonth, 1, 9, 0, 0);
    const monthName = reportDate.toLocaleString('en-US', { month: 'long' });

    if (parent.children.length > 0) {
      const hasLastMonthData = parent.children.some((child) => {
        const tests = child.student?.tests ?? [];
        return tests.some((t) => {
          if (t.status !== TestStatusType.ENDED) return false;
          const start = getTestStartTime(t);
          return (
            start &&
            start.getFullYear() === prevMonthYear &&
            start.getMonth() + 1 === prevMonth
          );
        });
      });

      if (hasLastMonthData) {
        alerts.push({
          id: `report-${prevMonthYear}-${prevMonth}`,
          alert_type: 'info',
          icon: '📅',
          icon_bg: '#E1F5EE',
          title: `${monthName} report is ready`,
          description: `Monthly performance reports for your children are ready to view.`,
          time_label: formatTimeLabel(reportDate),
          is_unread: false,
          actions: [
            { label: 'View trends', variant: 'primary', href: 'trends' },
          ],
          sort_ts: reportDate.getTime(),
        });
      }
    }

    return alerts
      .sort((a, b) => b.sort_ts - a.sort_ts)
      .map(({ sort_ts: _sort_ts, ...rest }) => rest);
  }

  async listChildMonthlyReports(
    parentEmail: string,
    childId: string,
  ): Promise<
    { month: number; year: number; avg_score: number; total_questions: number; streak_days: number }[]
  > {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { email: parentEmail } },
      relations: [
        'student.tests.submitted_answers.question',
        'student.tests.time_events',
      ],
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    if (!child.student) return [];

    const endedTests = child.student.tests.filter(
      (t) => t.status === TestStatusType.ENDED,
    );

    const getTestStartTime = (test: Test): Date | null => {
      const event = test.time_events.find(
        (e) => e.type === TimeEventType.STARTED,
      );
      return event ? new Date(event.recorded_at) : null;
    };

    const monthlyMap = new Map<
      string,
      { total_score: number; count: number; questions: number; days: Set<string> }
    >();

    for (const test of endedTests) {
      const start = getTestStartTime(test);
      if (!start) continue;

      const key = `${start.getFullYear()}-${start.getMonth() + 1}`;
      const entry = monthlyMap.get(key) ?? {
        total_score: 0,
        count: 0,
        questions: 0,
        days: new Set<string>(),
      };

      const answers = test.submitted_answers;
      const correct = answers.filter((a) => a.is_correct === true).length;
      const score = answers.length > 0 ? (correct / answers.length) * 100 : 0;

      entry.total_score += score;
      entry.count += 1;
      entry.questions += answers.length;
      entry.days.add(start.toISOString().split('T')[0]);
      monthlyMap.set(key, entry);
    }

    return Array.from(monthlyMap.entries())
      .map(([key, entry]) => {
        const [year, month] = key.split('-').map(Number);
        return {
          month,
          year,
          avg_score: entry.count > 0 ? entry.total_score / entry.count : 0,
          total_questions: entry.questions,
          streak_days: entry.days.size,
        };
      })
      .sort((a, b) => b.year - a.year || b.month - a.month);
  }

  private async generateUniqueUsername(
    full_name: string,
    entityManager: any,
  ): Promise<string> {
    const parts = full_name.trim().toLowerCase().split(/\s+/);
    const base =
      parts.length >= 2 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0];

    let username: string;
    let exists = true;

    while (exists) {
      const suffix = Math.floor(10 + Math.random() * 90).toString();
      username = `${base}${suffix}`;
      const found = await entityManager.findOne(Child, { where: { username } });
      exists = !!found;
    }

    return username;
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
}
