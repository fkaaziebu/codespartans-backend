import { UseGuards } from '@nestjs/common';
import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';
import { AccountDeletionService } from 'src/modules/auth/services/account-deletion.service';
import { RequestMetadata } from 'src/modules/auth/entities/deletion-audit-log.entity';
import { AccountDeletionResponse } from 'src/modules/auth/types';
import { Course } from 'src/modules/inventory/entities/course.entity';
import { TestAssignment } from 'src/modules/simulation/entities/test_assignment.entity';
import {
  GqlJwtAuthGuard,
  GqlPendingDeletionGuard,
  GqlThrottlerGuard,
} from 'src/helpers/guards';
import { PaginationInput } from 'src/helpers/inputs';
import { RefreshTokenResponse } from 'src/modules/auth/types';
import { Category } from 'src/modules/inventory/entities/category.entity';
import { AttemptConnection } from 'src/modules/inventory/types';
import { SubjectProgressResponse } from 'src/modules/inventory/types/subject-progress-response.type';
import { WeakSubjectAreaResponse } from 'src/modules/inventory/types/weak-subject-area-response.type';
import { AddChildInput } from '../inputs/add-child.input';
import { LoginChildInput } from '../inputs/login-child.input';
import { LoginParentInput } from '../inputs/login-parent.input';
import { RegisterParentInput } from '../inputs/register-parent.input';
import { SetupParentAccountInput } from '../inputs/setup-parent-account.input';
import { VerifyChildUsernameInput } from '../inputs/verify-child-username.input';
import { VerifyParentInput } from '../inputs/verify-parent.input';
import { ParentService } from '../services/parent.service';
import {
  ActivityConnection,
  AddChildResponse,
  AlertResponse,
  ChildConnection,
  ChildStatsResponse,
  LoginChildResponse,
  LoginParentResponse,
  MonthlyReportResponse,
  RegisterParentResponse,
  SetupChildResult,
  DayStreakResponse,
  StreakResponse,
  VerifyChildUsernameResponse,
} from '../types';

function extractMeta(req: any): RequestMetadata {
  const forwarded = req.headers?.['x-forwarded-for'] as string | undefined;
  return {
    ip: forwarded?.split(',')[0]?.trim() ?? req.ip ?? null,
    userAgent: (req.headers?.['user-agent'] as string) ?? null,
  };
}

@Resolver()
export class ParentResolver {
  constructor(
    private readonly parentService: ParentService,
    private readonly accountDeletionService: AccountDeletionService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => RegisterParentResponse)
  async registerParent(@Args('input') input: RegisterParentInput) {
    return this.parentService.registerParent(input);
  }

  @Mutation(() => RegisterParentResponse)
  async verifyParentAccount(@Args('input') input: VerifyParentInput) {
    return this.parentService.verifyParentAccount(input);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => RegisterParentResponse)
  async resendParentAccountValidationCode(@Args('email') email: string) {
    return this.parentService.resendParentAccountValidationCode(email);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => LoginParentResponse)
  async loginParent(@Args('input') input: LoginParentInput) {
    return this.parentService.loginParent(input);
  }

  @Mutation(() => RefreshTokenResponse)
  async refreshParentToken(@Args('refresh_token') refresh_token: string) {
    return this.parentService.refreshParentToken(refresh_token);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => RegisterParentResponse)
  async requestParentPasswordReset(@Args('email') email: string) {
    return this.parentService.requestParentPasswordReset({ email });
  }

  @Mutation(() => RegisterParentResponse)
  async resetParentPassword(
    @Args('email') email: string,
    @Args('token') token: string,
    @Args('password') password: string,
  ) {
    return this.parentService.resetParentPassword({ email, token, password });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => RegisterParentResponse)
  async changeParentPassword(
    @Args('currentPassword') currentPassword: string,
    @Args('newPassword') newPassword: string,
    @Context() context,
  ) {
    const { email } = context.req.user;
    return this.parentService.changeParentPassword({
      email,
      currentPassword,
      newPassword,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => [SetupChildResult])
  async setupParentAccount(
    @Args('input') input: SetupParentAccountInput,
    @Context() context,
  ) {
    const { email } = context.req.user;
    return this.parentService.setupParentAccount(email, input.children);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => AddChildResponse)
  async addChild(@Args('input') input: AddChildInput, @Context() context) {
    const { email } = context.req.user;
    return this.parentService.addChild(email, input);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => AddChildResponse)
  async resetChildPin(@Args('childId') childId: string, @Context() context) {
    const { email } = context.req.user;
    return this.parentService.resetChildPin(email, childId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => RegisterParentResponse)
  async shareChildLogin(@Args('childId') childId: string, @Context() context) {
    const { email } = context.req.user;
    return this.parentService.shareChildLogin(email, childId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [Category])
  async listParentOrganizationCategories(
    @Args('searchTerm', { nullable: true }) searchTerm?: string,
  ) {
    return this.parentService.listOrganizationCategories(searchTerm);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => ChildConnection)
  async listChildren(
    @Context() context,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    const { email } = context.req.user;
    return this.parentService.listChildren(email, pagination);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => ChildStatsResponse)
  async getChildStats(@Args('childId') childId: string, @Context() context) {
    const { email } = context.req.user;
    return this.parentService.getChildStats(email, childId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [SubjectProgressResponse])
  async getChildSubjectProgress(
    @Args('childId') childId: string,
    @Context() context,
    @Args('courseId', { nullable: true }) courseId?: string,
  ) {
    const { email } = context.req.user;
    return this.parentService.getChildSubjectProgress(email, childId, courseId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => AttemptConnection)
  async getChildTestsHistory(
    @Args('childId') childId: string,
    @Context() context,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    const { email } = context.req.user;
    return this.parentService.getChildTestsHistory(email, childId, pagination);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [WeakSubjectAreaResponse])
  async getChildWeakAreas(
    @Args('childId') childId: string,
    @Context() context,
  ) {
    const { email } = context.req.user;
    return this.parentService.getChildWeakAreas(email, childId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => ActivityConnection)
  async getChildActivity(
    @Args('childId') childId: string,
    @Context() context,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    const { email } = context.req.user;
    return this.parentService.getChildActivity(email, childId, pagination);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => StreakResponse)
  async getChildStreak(@Args('childId') childId: string, @Context() context) {
    const { email } = context.req.user;
    return this.parentService.getChildStreak(email, childId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [DayStreakResponse])
  async listChildStreak(
    @Args('childId') childId: string,
    @Args('month', { type: () => Int }) month: number,
    @Args('year', { type: () => Int }) year: number,
    @Context() context,
  ) {
    const { email } = context.req.user;
    return this.parentService.listChildStreak(email, childId, month, year);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Mutation(() => VerifyChildUsernameResponse)
  async verifyChildUsername(@Args('input') input: VerifyChildUsernameInput) {
    return this.parentService.verifyChildUsername(input.username);
  }

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Mutation(() => LoginChildResponse)
  async loginChild(@Args('input') input: LoginChildInput) {
    return this.parentService.loginChild(input.temp_token, input.pin);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => TestAssignment)
  async assignTestToChild(
    @Args('childId') childId: string,
    @Args('suiteId') suiteId: string,
    @Context() context,
    @Args('note', { nullable: true }) note?: string,
  ) {
    const { email } = context.req.user;
    return this.parentService.assignTestToChild(email, childId, suiteId, note);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [AlertResponse])
  async listParentAlerts(@Context() context) {
    const { email } = context.req.user;
    return this.parentService.listParentAlerts(email);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [MonthlyReportResponse])
  async listChildMonthlyReports(
    @Args('childId') childId: string,
    @Context() context,
  ) {
    const { email } = context.req.user;
    return this.parentService.listChildMonthlyReports(email, childId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [Course])
  async listChildCourses(@Args('childId') childId: string, @Context() context) {
    const { email } = context.req.user;
    return this.parentService.listChildCourses(email, childId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [TestAssignment])
  async listChildAssignments(
    @Args('childId') childId: string,
    @Context() context,
  ) {
    const { email } = context.req.user;
    return this.parentService.listChildAssignments(email, childId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => AccountDeletionResponse)
  async requestParentAccountDeletion(@Context() context) {
    const { id } = context.req.user;
    return this.accountDeletionService.requestParentAccountDeletion(
      id,
      extractMeta(context.req),
    );
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => AccountDeletionResponse)
  async deleteChild(@Args('childId') childId: string, @Context() context) {
    const { email } = context.req.user;
    return this.accountDeletionService.deleteChild(
      email,
      childId,
      extractMeta(context.req),
    );
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => AccountDeletionResponse)
  async cancelChildDeletion(
    @Args('childId') childId: string,
    @Context() context,
  ) {
    const { email } = context.req.user;
    return this.parentService.cancelChildDeletion(
      email,
      childId,
      extractMeta(context.req),
    );
  }

  @UseGuards(GqlPendingDeletionGuard)
  @Mutation(() => RegisterParentResponse)
  async verifyCancellationOtp(@Args('otp') otp: string, @Context() context) {
    const { id } = context.req.user;
    return this.parentService.verifyCancellationOtp(id, otp);
  }

  @UseGuards(GqlPendingDeletionGuard)
  @Mutation(() => LoginParentResponse)
  async cancelParentAccountDeletion(@Context() context) {
    const { id } = context.req.user;
    return this.parentService.cancelParentAccountDeletion(
      id,
      extractMeta(context.req),
    );
  }
}
