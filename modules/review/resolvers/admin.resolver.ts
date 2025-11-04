import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  IssueTypeClass,
  ReviewTypeClass,
  VersionTypeClass,
} from 'src/database/types';
import { GqlJwtAuthGuard } from 'src/helpers/guards';
import { PaginationInput } from 'src/helpers/inputs';
import { IssueInfoInput, ReviewInfoInput } from '../inputs';
import { AdminService } from '../services';
import {
  QuestionConnection,
  VersionConnection,
  VersionResponse,
} from '../types';

@Resolver()
export class AdminResolver {
  constructor(private readonly adminService: AdminService) {}
  // Queries
  @UseGuards(GqlJwtAuthGuard)
  @Query(() => QuestionConnection)
  listQuestionsForVersion(
    @Context() context,
    @Args('versionId') versionId: string,
    @Args('searchTerm', { nullable: true }) searchTerm?: string,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    const { email } = context.req.user;

    return this.adminService.listQuestionsForVersionPaginated({
      email,
      searchTerm,
      versionId,
      pagination,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => VersionConnection)
  listAssignedVersions(@Context() context) {
    const { email } = context.req.user;

    return this.adminService.listAssignedVersionsPaginated({
      email,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => VersionResponse)
  getCourseVersion(@Context() context, @Args('versionId') versionId: string) {
    const { email } = context.req.user;

    return this.adminService.getCourseVersion({
      email,
      versionId,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => ReviewTypeClass)
  getVersionReview(@Context() context, @Args('reviewId') reviewId: string) {
    const { email } = context.req.user;

    return this.adminService.getVersionReview({
      email,
      reviewId,
    });
  }

  // Mutation
  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => ReviewTypeClass)
  addCourseVersionReview(
    @Context() context,
    @Args('versionId') versionId: string,
    @Args('reviewInfo', { type: () => ReviewInfoInput!, nullable: false })
    reviewInfo: ReviewInfoInput,
  ) {
    const { email } = context.req.user;
    return this.adminService.addCourseVersionReview({
      email,
      versionId,
      reviewInfo,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => IssueTypeClass)
  addReviewIssue(
    @Context() context,
    @Args('reviewId') reviewId: string,
    @Args('issueInfo', { type: () => IssueInfoInput!, nullable: false })
    issueInfo: IssueInfoInput,
  ) {
    const { email } = context.req.user;
    return this.adminService.addReviewIssue({ email, reviewId, issueInfo });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => IssueTypeClass)
  closeIssue(@Context() context, @Args('issueId') issueId: string) {
    const { email } = context.req.user;
    return this.adminService.closeIssue({ email, issueId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => ReviewTypeClass)
  closeReview(@Context() context, @Args('reviewId') reviewId: string) {
    const { email } = context.req.user;
    return this.adminService.closeReview({ email, reviewId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => VersionTypeClass)
  approveCourseVersion(
    @Context() context,
    @Args('versionId') versionId: string,
  ) {
    const { email } = context.req.user;
    return this.adminService.approveCourseVersion({ email, versionId });
  }
}
