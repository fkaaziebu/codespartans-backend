import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AccountStatus } from '../../auth/types/account-deletion-response.type';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { HashHelper, PaginateHelper } from '../../../helpers';
import { PaginationInput } from '../../../helpers/inputs';
import { TimeEventType } from '../../simulation/entities/time_event.entity';
import { TestStatusType } from '../../simulation/entities/test.entity';
import { SubjectProgressResponse } from '../../inventory/types/subject-progress-response.type';
import { WeakSubjectAreaResponse } from '../../inventory/types/weak-subject-area-response.type';
import { AttemptConnection, AttemptResponse } from '../../inventory/types';
import { Test } from '../../simulation/entities/test.entity';
import {
  TestAssignment,
  TestAssignmentStatus,
} from '../../simulation/entities/test_assignment.entity';
import { TestSuite } from '../../review/entities/test_suite.entity';
import { Student } from '../../auth/entities/student.entity';
import { Organization } from '../../auth/entities/organization.entity';
import { Cart } from '../../inventory/entities/cart.entity';
import { Category } from '../../inventory/entities/category.entity';
import { Course } from '../../inventory/entities/course.entity';
import { v4 as uuidv4 } from 'uuid';
import { EmailProducer } from '../../auth/services/email.producer';
import { SignupProducer } from '../../auth/services/signup.producer';
import { AccountDeletionService } from '../../auth/services/account-deletion.service';
import { RequestMetadata } from '../../auth/entities/deletion-audit-log.entity';
import { Child, ClassLevel } from '../entities/child.entity';
import { Gender, Parent } from '../entities/parent.entity';

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
  private readonly gracePeriodMs: number;
  private readonly refreshTokenTtlMs: number;
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
    private readonly signupProducer: SignupProducer,
    private readonly accountDeletionService: AccountDeletionService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.gracePeriodMs =
      this.configService.get<number>('ACCOUNT_DELETION_GRACE_DAYS') *
      24 *
      60 *
      60 *
      1000;
    this.refreshTokenTtlMs =
      (this.configService.get<number>('REFRESH_TOKEN_TTL_HOURS') ?? 24) * 60 * 60 * 1000;
  }

  async registerParent({
    first_name,
    last_name,
    email,
    whatsapp_number,
    password,
    gender,
  }: {
    first_name: string;
    last_name: string;
    email: string;
    whatsapp_number: string;
    password: string;
    gender?: Gender;
  }): Promise<{ message: string }> {
    return this.parentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const existing = await transactionalEntityManager.findOne(Parent, {
          where: { email },
        });

        if (existing) {
          await this.emailProducer.sendParentAccountAlreadyExistsEmail({
            email,
            name: `${existing.first_name} ${existing.last_name}`,
          });
          return {
            message: 'Registration successful. Please verify your email.',
          };
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
        parent.gender = gender ?? Gender.Male;
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
  ): Promise<{ access_token: string; refresh_token: string }> {
    let payload: {
      id: string;
      role: 'PARENT';
      type: string;
      iat: number;
    };

    try {
      payload = this.jwtService.verify(refresh_token);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh' || payload.role !== 'PARENT') {
      throw new UnauthorizedException('Invalid token type');
    }

    const isDeactivated = await this.cacheManager.get(
      `deactivated:${payload.id}`,
    );
    if (isDeactivated) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    const pwChanged = await this.cacheManager.get(`pw_changed:${payload.id}`);
    if (pwChanged && payload.iat < Number(pwChanged)) {
      throw new UnauthorizedException(
        'Password was recently changed. Please log in again.',
      );
    }
    const loggedOut = await this.cacheManager.get(`logged_out:${payload.id}`);
    if (loggedOut && payload.iat <= Number(loggedOut)) {
      throw new UnauthorizedException('Logged out. Please log in again.');
    }

    const {
      type: _type,
      iat: _iat,
      exp: _exp,
      ...tokenPayload
    } = payload as any;
    const access_token = this.jwtService.sign(tokenPayload);
    const new_refresh_token = this.jwtService.sign(
      { ...tokenPayload, type: 'refresh' },
      { expiresIn: `${this.configService.get<number>('REFRESH_TOKEN_TTL_HOURS') ?? 24}h` },
    );
    return { access_token, refresh_token: new_refresh_token };
  }

  async logoutParent({
    userId,
  }: {
    userId: string;
  }): Promise<{ message: string }> {
    await this.cacheManager.set(
      `logged_out:${userId}`,
      Math.floor(Date.now() / 1000).toString(),
      this.refreshTokenTtlMs,
    );
    return { message: 'Logged out successfully' };
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

        await this.signupProducer.enqueueFreeTrial({ email, role: 'PARENT' });

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
    // Validate credentials inside transaction, then restore outside to avoid write-lock deadlock
    const foundParent = await this.parentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const record = await transactionalEntityManager.findOne(Parent, {
          where: { email },
        });

        if (!record) {
          throw new BadRequestException('Email or password is incorrect');
        }

        if (!record.password) {
          throw new BadRequestException('Email or password is incorrect');
        }

        const isPasswordValid = await HashHelper.compare(
          password,
          record.password,
        );

        if (!isPasswordValid) {
          throw new BadRequestException('Email or password is incorrect');
        }

        if (!record.is_account_validated) {
          throw new BadRequestException(
            'Account not verified. Please check your email for the verification code.',
          );
        }

        if (record.is_deactivated) {
          const elapsed =
            Date.now() - new Date(record.deactivated_at).getTime();
          if (elapsed >= this.gracePeriodMs) {
            throw new BadRequestException('This account no longer exists.');
          }
        }

        return record;
      },
    );

    if (foundParent.is_deactivated) {
      const deletionScheduledFor = new Date(
        new Date(foundParent.deactivated_at).getTime() + this.gracePeriodMs,
      );
      const pendingToken = this.jwtService.sign(
        {
          id: foundParent.id,
          role: 'PARENT',
          type: 'pending_deletion',
        },
        { expiresIn: '15m' },
      );

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await this.cacheManager.set(
        `cancel_otp:${foundParent.id}`,
        otp,
        10 * 60 * 1000,
      );
      await this.emailProducer.sendCancellationOtpEmail({
        email: foundParent.email,
        name: `${foundParent.first_name} ${foundParent.last_name}`,
        otp,
      });

      return {
        ...foundParent,
        token: pendingToken,
        account_status: AccountStatus.PENDING_DELETION,
        deletion_scheduled_for: deletionScheduledFor,
      };
    }

    const payload = {
      id: foundParent.id,
      role: 'PARENT' as const,
    };

    const token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: `${this.configService.get<number>('REFRESH_TOKEN_TTL_HOURS') ?? 24}h` },
    );

    return { ...foundParent, token, refresh_token };
  }

  async verifyCancellationOtp(
    parentId: string,
    otp: string,
  ): Promise<{ message: string }> {
    const stored = await this.cacheManager.get<string>(
      `cancel_otp:${parentId}`,
    );
    if (!stored || stored !== otp) {
      throw new BadRequestException('Invalid or expired OTP.');
    }
    await this.cacheManager.del(`cancel_otp:${parentId}`);
    await this.cacheManager.set(
      `cancel_otp_verified:${parentId}`,
      '1',
      10 * 60 * 1000,
    );
    return { message: 'OTP verified. You may now cancel deletion.' };
  }

  async cancelParentAccountDeletion(
    parentId: string,
    meta?: RequestMetadata,
  ): Promise<LoginParentResponse> {
    const verified = await this.cacheManager.get(
      `cancel_otp_verified:${parentId}`,
    );
    if (!verified) {
      throw new UnauthorizedException(
        'Email verification required before cancelling deletion.',
      );
    }
    await this.cacheManager.del(`cancel_otp_verified:${parentId}`);

    const parent = await this.parentRepository.findOne({
      where: { id: parentId },
      relations: ['children', 'children.student'],
    });

    if (!parent || !parent.is_deactivated) {
      throw new UnauthorizedException(
        'No pending deletion found for this account.',
      );
    }

    await this.accountDeletionService.restoreParent(parent, meta ?? null);

    const payload = {
      id: parent.id,
      role: 'PARENT' as const,
    };

    const token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: `${this.configService.get<number>('REFRESH_TOKEN_TTL_HOURS') ?? 24}h` },
    );

    return {
      ...parent,
      token,
      refresh_token,
      account_status: AccountStatus.ACTIVE,
    };
  }

  async cancelChildDeletion(
    parentId: string,
    childId: string,
    meta: RequestMetadata | null = null,
  ) {
    const child = await this.childRepository.findOne({
      where: { id: childId },
      relations: ['parent', 'student'],
    });

    if (!child) {
      throw new NotFoundException('Child not found.');
    }

    if (child.parent.id !== parentId) {
      throw new ForbiddenException(
        'You are not authorized to restore this child account.',
      );
    }

    if (!child.student || !child.student.is_deactivated) {
      throw new NotFoundException(
        'No pending deletion found for this child account.',
      );
    }

    await this.accountDeletionService.restoreChild(
      child.parent.id,
      child,
      meta,
    );

    return {
      message: 'Child account deletion cancelled.',
      deletionScheduledFor: null,
      status: AccountStatus.ACTIVE,
    };
  }

  async requestParentPasswordReset({ email }: { email: string }) {
    return this.parentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const parent = await transactionalEntityManager.findOne(Parent, {
          where: { email },
        });

        if (!parent) {
          return { message: 'Password reset link sent to your email' };
        }

        const resetCode = uuidv4();
        parent.reset_token = resetCode;
        await transactionalEntityManager.save(parent);

        await this.emailProducer.sendParentPasswordResetEmail({
          email,
          name: `${parent.first_name} ${parent.last_name}`,
          resetCode,
        });

        return { message: 'Password reset link sent to your email' };
      },
    );
  }

  async resetParentPassword({
    email,
    password,
    token,
  }: {
    email: string;
    password: string;
    token: string;
  }) {
    let parentId: string;

    const result = await this.parentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const parent = await transactionalEntityManager.findOne(Parent, {
          where: { email },
        });

        if (!parent || parent.reset_token !== token) {
          throw new BadRequestException('Invalid password reset details');
        }

        parentId = parent.id;
        parent.reset_token = '';
        parent.password = await HashHelper.encrypt(password);
        await transactionalEntityManager.save(parent);

        return { message: 'Password reset is successful' };
      },
    );

    await this.cacheManager.set(`pw_changed:${parentId}`, Math.floor(Date.now() / 1000).toString(), this.refreshTokenTtlMs);
    return result;
  }

  async changeParentPassword({
    id,
    currentPassword,
    newPassword,
  }: {
    id: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    let parentId: string;

    const result = await this.parentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const parent = await transactionalEntityManager.findOne(Parent, {
          where: { id },
        });

        if (!parent) {
          throw new BadRequestException('Invalid credentials');
        }

        const isValid = await HashHelper.compare(
          currentPassword,
          parent.password,
        );
        if (!isValid) {
          throw new BadRequestException('Current password is incorrect');
        }

        parentId = parent.id;
        parent.password = await HashHelper.encrypt(newPassword);
        await transactionalEntityManager.save(parent);

        return { message: 'Password changed successfully' };
      },
    );

    await this.cacheManager.set(`pw_changed:${parentId}`, Math.floor(Date.now() / 1000).toString(), this.refreshTokenTtlMs);
    return result;
  }

  async setupParentAccount(
    parentId: string,
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
          where: { id: parentId },
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
    parentId: string,
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
          where: { id: parentId },
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
    parentId: string,
    childId: string,
  ): Promise<{ message: string; pin: string }> {
    return this.parentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const child = await transactionalEntityManager.findOne(Child, {
          where: { id: childId, parent: { id: parentId } },
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

        await this.cacheManager.del(`child_pin_attempts:${childId}`);
        await this.cacheManager.del(`child_pin_locked:${childId}`);

        return { message: 'Pin reset successfully', pin: rawPin };
      },
    );
  }

  async shareChildLogin(
    parentId: string,
    childId: string,
  ): Promise<{ message: string }> {
    return this.childRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const child = await transactionalEntityManager.findOne(Child, {
          where: { id: childId, parent: { id: parentId } },
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

  async listChildren(parentId: string, pagination?: PaginationInput) {
    return this.parentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const parent = await transactionalEntityManager.findOne(Parent, {
          where: { id: parentId },
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
    parentId: string,
    childId: string,
  ): Promise<ChildStatsResponse> {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { id: parentId } },
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
    parentId: string,
    childId: string,
    courseId?: string,
  ): Promise<SubjectProgressResponse[]> {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { id: parentId } },
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
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      )
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
    parentId: string,
    childId: string,
    pagination?: PaginationInput,
  ): Promise<AttemptConnection> {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { id: parentId } },
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
    parentId: string,
    childId: string,
  ): Promise<WeakSubjectAreaResponse[]> {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { id: parentId } },
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
    parentId: string,
    childId: string,
    pagination?: PaginationInput,
  ): Promise<ActivityConnection> {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { id: parentId } },
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
    parentId: string,
    childId: string,
  ): Promise<StreakResponse> {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { id: parentId } },
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
    parentId: string,
    childId: string,
    month: number,
    year: number,
  ): Promise<{ date: string; is_active: boolean }[]> {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { id: parentId } },
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
    const child = await this.childRepository.findOne({
      where: { username },
      relations: ['student'],
    });

    if (!child) {
      throw new NotFoundException('Username not found');
    }

    if (child.student?.is_deactivated) {
      throw new UnauthorizedException(
        'This account is pending deletion. Contact your parent to cancel.',
      );
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

  private readonly PIN_MAX_ATTEMPTS = 5;
  private readonly PIN_LOCK_TTL_MS = 5 * 60 * 1_000; // 5 minutes
  private readonly PIN_ATTEMPTS_TTL_MS = 30 * 60 * 1_000; // 30 minutes

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

    const childId = payload.id;
    const attemptsKey = `child_pin_attempts:${childId}`;
    const lockedKey = `child_pin_locked:${childId}`;

    const lockedAt = await this.cacheManager.get<string>(lockedKey);
    if (lockedAt) {
      throw new UnauthorizedException({
        message: 'Account locked for 5 minutes',
        code: 'ACCOUNT_LOCKED',
        locked_at: lockedAt,
      });
    }

    const currentAttempts =
      (await this.cacheManager.get<number>(attemptsKey)) ?? 0;
    if (currentAttempts >= this.PIN_MAX_ATTEMPTS) {
      await this.cacheManager.del(attemptsKey);
    }

    const child = await this.childRepository.findOne({
      where: { id: childId },
      relations: ['student.organizations'],
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    if (child.student?.is_deactivated) {
      throw new UnauthorizedException(
        'This account is pending deletion. Contact your parent to cancel.',
      );
    }

    const isPinValid = await HashHelper.compare(pin, child.pin);

    if (!isPinValid) {
      const attempts =
        (await this.cacheManager.get<number>(attemptsKey) ?? 0) + 1;
      await this.cacheManager.set(attemptsKey, attempts, this.PIN_ATTEMPTS_TTL_MS);

      if (attempts >= this.PIN_MAX_ATTEMPTS) {
        const timestamp = new Date().toISOString();
        await this.cacheManager.set(lockedKey, timestamp, this.PIN_LOCK_TTL_MS);
        throw new UnauthorizedException({
          message: 'Account locked for 5 minutes',
          code: 'ACCOUNT_LOCKED',
          locked_at: timestamp,
        });
      }

      const messages: Record<number, string> = {
        1: 'Incorrect PIN, try again',
        2: 'Incorrect PIN, you have 3 more attempts',
        3: 'Incorrect PIN, you have 2 more attempts',
        4: 'Incorrect PIN, you have 1 more attempt. Your account will be locked for 5 minutes if this fails',
      };

      throw new UnauthorizedException({
        message: messages[attempts] ?? 'Incorrect PIN, try again',
        code: 'INVALID_PIN',
        attempts_remaining: this.PIN_MAX_ATTEMPTS - attempts,
      });
    }

    await this.cacheManager.del(attemptsKey);

    const tokenPayload = {
      id: child.student.id,
      role: 'CHILD' as const,
    };

    const token = this.jwtService.sign(tokenPayload);
    const refresh_token = this.jwtService.sign(
      { ...tokenPayload, type: 'refresh' },
      { expiresIn: `${this.configService.get<number>('REFRESH_TOKEN_TTL_HOURS') ?? 24}h` },
    );

    return { ...child, token, refresh_token };
  }

  async requestChildPinReset(temp_token: string): Promise<boolean> {
    let payload: { id: string; username: string; role: string; type: string };

    try {
      payload = this.jwtService.verify(temp_token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.type !== 'temp' || payload.role !== 'CHILD') {
      throw new UnauthorizedException('Invalid token type');
    }

    const lockedKey = `child_pin_locked:${payload.id}`;
    const lockedAt = await this.cacheManager.get<string>(lockedKey);
    if (!lockedAt) {
      throw new BadRequestException('Account is not currently locked');
    }

    const child = await this.childRepository.findOne({
      where: { id: payload.id },
      relations: ['parent'],
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    await this.emailProducer.sendChildPinResetRequestEmail({
      email: child.parent.email,
      parentName: `${child.parent.first_name} ${child.parent.last_name}`,
      childName: child.full_name,
    });

    return true;
  }

  async assignTestToChild(
    parentId: string,
    childId: string,
    suiteId: string,
    note?: string,
  ): Promise<TestAssignment> {
    return this.parentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const child = await transactionalEntityManager.findOne(Child, {
          where: { id: childId, parent: { id: parentId } },
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
        if (note) assignment.note = note;

        return transactionalEntityManager.save(TestAssignment, assignment);
      },
    );
  }

  async listChildCourses(
    parentId: string,
    childId: string,
  ): Promise<Course[]> {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { id: parentId } },
      relations: [
        'student',
        'student.subscribed_courses',
        'student.subscribed_courses.approved_version',
        'student.subscribed_courses.approved_version.test_suites',
        'student.subscribed_courses.approved_version.test_suites.questions',
      ],
    });

    if (!child) throw new NotFoundException('Child not found');

    return child.student?.subscribed_courses ?? [];
  }

  async listChildAssignments(
    parentId: string,
    childId: string,
  ): Promise<TestAssignment[]> {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { id: parentId } },
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

  async listParentAlerts(parentId: string): Promise<
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
      where: { id: parentId },
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
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
      });
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
              {
                label: 'View weak areas',
                variant: 'primary',
                href: 'weak-areas',
              },
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
              now.getTime() - recentTest.start!.getTime() < 24 * 60 * 60 * 1000,
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
    parentId: string,
    childId: string,
  ): Promise<
    {
      month: number;
      year: number;
      avg_score: number;
      total_questions: number;
      streak_days: number;
    }[]
  > {
    const child = await this.childRepository.findOne({
      where: { id: childId, parent: { id: parentId } },
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
      {
        total_score: number;
        count: number;
        questions: number;
        days: Set<string>;
      }
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
