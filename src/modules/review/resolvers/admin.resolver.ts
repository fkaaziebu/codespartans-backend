import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Issue as IssueTypeClass } from 'src/modules/review/entities/issue.entity';
import { Review as ReviewTypeClass } from 'src/modules/review/entities/review.entity';
import { Version as VersionTypeClass } from 'src/modules/review/entities/version.entity';
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
    const { id } = context.req.user;

    return this.adminService.listQuestionsForVersionPaginated({
      id,
      searchTerm,
      versionId,
      pagination,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => VersionConnection)
  listAssignedVersions(@Context() context) {
    const { id } = context.req.user;

    return this.adminService.listAssignedVersionsPaginated({
      id,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => VersionResponse)
  getCourseVersion(@Context() context, @Args('versionId') versionId: string) {
    const { id } = context.req.user;

    return this.adminService.getCourseVersion({
      id,
      versionId,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => ReviewTypeClass)
  getVersionReview(@Context() context, @Args('reviewId') reviewId: string) {
    const { id } = context.req.user;

    return this.adminService.getVersionReview({
      id,
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
    const { id } = context.req.user;
    return this.adminService.addCourseVersionReview({
      id,
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
    const { id } = context.req.user;
    return this.adminService.addReviewIssue({ id, reviewId, issueInfo });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => IssueTypeClass)
  closeIssue(@Context() context, @Args('issueId') issueId: string) {
    const { id } = context.req.user;
    return this.adminService.closeIssue({ id, issueId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => ReviewTypeClass)
  closeReview(@Context() context, @Args('reviewId') reviewId: string) {
    const { id } = context.req.user;
    return this.adminService.closeReview({ id, reviewId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => VersionTypeClass)
  approveCourseVersion(
    @Context() context,
    @Args('versionId') versionId: string,
  ) {
    const { id } = context.req.user;
    return this.adminService.approveCourseVersion({ id, versionId });
  }
}
