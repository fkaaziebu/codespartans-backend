import { UseGuards } from '@nestjs/common';
import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlJwtAuthGuard } from 'src/helpers/guards';
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
  ChildConnection,
  ChildStatsResponse,
  LoginChildResponse,
  LoginParentResponse,
  RegisterParentResponse,
  SetupChildResult,
  DayStreakResponse,
  StreakResponse,
  VerifyChildUsernameResponse,
} from '../types';

@Resolver()
export class ParentResolver {
  constructor(private readonly parentService: ParentService) {}

  @Mutation(() => RegisterParentResponse)
  async registerParent(@Args('input') input: RegisterParentInput) {
    return this.parentService.registerParent(input);
  }

  @Mutation(() => RegisterParentResponse)
  async verifyParentAccount(@Args('input') input: VerifyParentInput) {
    return this.parentService.verifyParentAccount(input);
  }

  @Mutation(() => RegisterParentResponse)
  async resendParentAccountValidationCode(@Args('email') email: string) {
    return this.parentService.resendParentAccountValidationCode(email);
  }

  @Mutation(() => LoginParentResponse)
  async loginParent(@Args('input') input: LoginParentInput) {
    return this.parentService.loginParent(input);
  }

  @Mutation(() => RefreshTokenResponse)
  async refreshParentToken(@Args('refresh_token') refresh_token: string) {
    return this.parentService.refreshParentToken(refresh_token);
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
  async resetChildPin(
    @Args('childId') childId: string,
    @Context() context,
  ) {
    const { email } = context.req.user;
    return this.parentService.resetChildPin(email, childId);
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
  ) {
    const { email } = context.req.user;
    return this.parentService.getChildSubjectProgress(email, childId);
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

  @Mutation(() => VerifyChildUsernameResponse)
  async verifyChildUsername(@Args('input') input: VerifyChildUsernameInput) {
    return this.parentService.verifyChildUsername(input.username);
  }

  @Mutation(() => LoginChildResponse)
  async loginChild(@Args('input') input: LoginChildInput) {
    return this.parentService.loginChild(input.temp_token, input.pin);
  }
}
