import { ForbiddenException, UseGuards } from '@nestjs/common';
import { ParsePinPipe } from '../../../helpers/pipes/parse-pin.pipe';
import { ConfigService } from '@nestjs/config';
import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { RequestMetadata } from '../entities/deletion-audit-log.entity';
import { Student as StudentTypeClass } from 'src/modules/auth/entities/student.entity';
import {
  GqlJwtAuthGuard,
  GqlPendingDeletionGuard,
  GqlThrottlerGuard,
} from 'src/helpers/guards';
import { PaginationInput } from 'src/helpers/inputs';
import { StudentService } from '../services/student.service';
import { AccountDeletionService } from '../services/account-deletion.service';
import {
  AccountDeletionResponse,
  AccountStatus,
  LogoutResponse,
  OrganizationConnection,
  PasswordResetResponse,
  RefreshTokenResponse,
  RegisterResponse,
  StudentLoginResponse,
} from '../types';
import { Throttle } from '@nestjs/throttler';

function extractMeta(req: any): RequestMetadata {
  const forwarded = req.headers?.['x-forwarded-for'] as string | undefined;
  return {
    ip: forwarded?.split(',')[0]?.trim() ?? req.ip ?? null,
    userAgent: (req.headers?.['user-agent'] as string) ?? null,
  };
}

@Resolver(() => StudentTypeClass)
export class StudentResolver {
  constructor(
    private readonly studentService: StudentService,
    private readonly accountDeletionService: AccountDeletionService,
    private readonly configService: ConfigService,
  ) {}

  @ResolveField(() => AccountStatus, { nullable: true })
  account_status(@Parent() student: StudentTypeClass): AccountStatus {
    return student.deletion_job_id
      ? AccountStatus.PENDING_DELETION
      : AccountStatus.ACTIVE;
  }

  @ResolveField(() => Date, { nullable: true })
  deletion_scheduled_for(@Parent() student: StudentTypeClass): Date | null {
    if (!student.deactivated_at) return null;
    const graceDays =
      this.configService.get<number>('ACCOUNT_DELETION_GRACE_DAYS') ?? 30;
    const ms = Number(graceDays) * 24 * 60 * 60 * 1000;
    return new Date(student.deactivated_at.getTime() + ms);
  }
  // Queries
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(GqlThrottlerGuard)
  @Query(() => StudentLoginResponse)
  async loginStudent(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    return this.studentService.loginStudent({
      email,
      password,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => StudentTypeClass)
  async studentProfile(@Context() context) {
    const { id } = context.req.user;
    return this.studentService.studentProfile({ id });
  }

  @Query(() => OrganizationConnection)
  async listOrganizations(
    @Args('searchTerm', { nullable: true }) searchTerm?: string,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    return this.studentService.listOrganizationsPaginated({
      searchTerm,
      pagination,
    });
  }

  // Mutations
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => RegisterResponse)
  async registerStudent(
    @Args('name') name: string,
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    return this.studentService.registerStudent({
      name,
      email,
      password,
    });
  }

  @Mutation(() => RefreshTokenResponse)
  async refreshStudentToken(@Args('refresh_token') refresh_token: string) {
    return this.studentService.refreshStudentToken({ refresh_token });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => LogoutResponse)
  async logoutStudent(@Context() context) {
    const { id } = context.req.user;
    return this.studentService.logoutStudent({ userId: id });
  }

  @Mutation(() => PasswordResetResponse)
  async completeStudentAccountValidation(
    @Args('email') email: string,
    @Args('validation_code') validation_code: string,
  ) {
    return this.studentService.completeStudentAccountValidation({
      email,
      validation_code,
    });
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => PasswordResetResponse)
  async resendAccountValidationCode(@Args('email') email: string) {
    return this.studentService.resendAccountValidationCode({ email });
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => PasswordResetResponse)
  async requestStudentPasswordReset(@Args('email') email: string) {
    return this.studentService.requestStudentPasswordReset({
      email,
    });
  }

  @Mutation(() => PasswordResetResponse)
  async resetStudentPassword(
    @Args('email') email: string,
    @Args('token') token: string,
    @Args('password') password: string,
  ) {
    return this.studentService.resetStudentPassword({
      email,
      token,
      password,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => PasswordResetResponse)
  async changePassword(
    @Args('currentPassword') currentPassword: string,
    @Args('newPassword') newPassword: string,
    @Context() context,
  ) {
    const { id, role } = context.req.user;
    if (role === 'CHILD') {
      throw new ForbiddenException(
        'Children cannot use changePassword. Use changePin instead.',
      );
    }
    return this.studentService.changePassword({
      id,
      currentPassword,
      newPassword,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => PasswordResetResponse)
  async changePin(
    @Args('currentPin') currentPin: string,
    @Args('newPin', ParsePinPipe) newPin: string,
    @Context() context,
  ) {
    const { id, role } = context.req.user;
    if (role !== 'CHILD') {
      throw new ForbiddenException('Only child accounts can use changePin.');
    }
    return this.studentService.changePin({ id, currentPin, newPin });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => AccountDeletionResponse)
  async requestStudentAccountDeletion(@Context() context) {
    const { id, role } = context.req.user;
    if (role === 'CHILD') {
      throw new ForbiddenException(
        'Children cannot delete their own accounts.',
      );
    }
    return this.accountDeletionService.requestStudentAccountDeletion(
      id,
      extractMeta(context.req),
    );
  }

  @UseGuards(GqlPendingDeletionGuard)
  @Mutation(() => PasswordResetResponse)
  async verifyCancellationOtp(
    @Args('otp') otp: string,
    @Context() context,
  ) {
    const { id } = context.req.user;
    return this.studentService.verifyCancellationOtp(id, otp);
  }

  @UseGuards(GqlPendingDeletionGuard)
  @Mutation(() => StudentLoginResponse)
  async cancelStudentAccountDeletion(@Context() context) {
    const { id } = context.req.user;
    return this.studentService.cancelStudentAccountDeletion(
      id,
      extractMeta(context.req),
    );
  }
}
