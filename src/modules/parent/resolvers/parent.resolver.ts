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
import { LogoutResponse, RefreshTokenResponse } from 'src/modules/auth/types';
import { Category } from 'src/modules/inventory/entities/category.entity';
import { AttemptConnection } from 'src/modules/inventory/types';
import { SubjectProgressResponse } from 'src/modules/inventory/types/subject-progress-response.type';
import { WeakSubjectAreaResponse } from 'src/modules/inventory/types/weak-subject-area-response.type';
import { AddChildInput } from '../inputs/add-child.input';
import { LoginChildInput } from '../inputs/login-child.input';
import { RequestChildPinResetInput } from '../inputs/request-child-pin-reset.input';
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

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => LogoutResponse)
  async logoutParent(@Context() context) {
    const { id } = context.req.user;
    return this.parentService.logoutParent({ userId: id });
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
    const { id } = context.req.user;
    return this.parentService.changeParentPassword({
      id,
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
    const { id } = context.req.user;
    return this.parentService.setupParentAccount(id, input.children);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => AddChildResponse)
  async addChild(@Args('input') input: AddChildInput, @Context() context) {
    const { id } = context.req.user;
    return this.parentService.addChild(id, input);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => AddChildResponse)
  async resetChildPin(@Args('childId') childId: string, @Context() context) {
    const { id } = context.req.user;
    return this.parentService.resetChildPin(id, childId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => RegisterParentResponse)
  async shareChildLogin(@Args('childId') childId: string, @Context() context) {
    const { id } = context.req.user;
    return this.parentService.shareChildLogin(id, childId);
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
    const { id } = context.req.user;
    return this.parentService.listChildren(id, pagination);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => ChildStatsResponse)
  async getChildStats(@Args('childId') childId: string, @Context() context) {
    const { id } = context.req.user;
    return this.parentService.getChildStats(id, childId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [SubjectProgressResponse])
  async getChildSubjectProgress(
    @Args('childId') childId: string,
    @Context() context,
    @Args('courseId', { nullable: true }) courseId?: string,
  ) {
    const { id } = context.req.user;
    return this.parentService.getChildSubjectProgress(id, childId, courseId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => AttemptConnection)
  async getChildTestsHistory(
    @Args('childId') childId: string,
    @Context() context,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    const { id } = context.req.user;
    return this.parentService.getChildTestsHistory(id, childId, pagination);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [WeakSubjectAreaResponse])
  async getChildWeakAreas(
    @Args('childId') childId: string,
    @Context() context,
  ) {
    const { id } = context.req.user;
    return this.parentService.getChildWeakAreas(id, childId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => ActivityConnection)
  async getChildActivity(
    @Args('childId') childId: string,
    @Context() context,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    const { id } = context.req.user;
    return this.parentService.getChildActivity(id, childId, pagination);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => StreakResponse)
  async getChildStreak(@Args('childId') childId: string, @Context() context) {
    const { id } = context.req.user;
    return this.parentService.getChildStreak(id, childId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [DayStreakResponse])
  async listChildStreak(
    @Args('childId') childId: string,
    @Args('month', { type: () => Int }) month: number,
    @Args('year', { type: () => Int }) year: number,
    @Context() context,
  ) {
    const { id } = context.req.user;
    return this.parentService.listChildStreak(id, childId, month, year);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => VerifyChildUsernameResponse)
  async verifyChildUsername(@Args('input') input: VerifyChildUsernameInput) {
    return this.parentService.verifyChildUsername(input.username);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => LoginChildResponse)
  async loginChild(@Args('input') input: LoginChildInput) {
    return this.parentService.loginChild(input.temp_token, input.pin);
  }

  @Throttle({ default: { limit: 3, ttl: 300_000 } })
  @UseGuards(GqlThrottlerGuard)
  @Mutation(() => Boolean)
  async requestChildPinReset(
    @Args('input') input: RequestChildPinResetInput,
  ) {
    return this.parentService.requestChildPinReset(input.temp_token);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => TestAssignment)
  async assignTestToChild(
    @Args('childId') childId: string,
    @Args('suiteId') suiteId: string,
    @Context() context,
    @Args('note', { nullable: true }) note?: string,
  ) {
    const { id } = context.req.user;
    return this.parentService.assignTestToChild(id, childId, suiteId, note);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [AlertResponse])
  async listParentAlerts(@Context() context) {
    const { id } = context.req.user;
    return this.parentService.listParentAlerts(id);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [MonthlyReportResponse])
  async listChildMonthlyReports(
    @Args('childId') childId: string,
    @Context() context,
  ) {
    const { id } = context.req.user;
    return this.parentService.listChildMonthlyReports(id, childId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [Course])
  async listChildCourses(@Args('childId') childId: string, @Context() context) {
    const { id } = context.req.user;
    return this.parentService.listChildCourses(id, childId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [TestAssignment])
  async listChildAssignments(
    @Args('childId') childId: string,
    @Context() context,
  ) {
    const { id } = context.req.user;
    return this.parentService.listChildAssignments(id, childId);
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
    const { id } = context.req.user;
    return this.accountDeletionService.deleteChild(
      id,
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
    const { id } = context.req.user;
    return this.parentService.cancelChildDeletion(
      id,
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
