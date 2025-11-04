import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CourseTypeClass,
  IssueTypeClass,
  ReviewTypeClass,
} from 'src/database/types';
import { IssueStatusType } from 'src/database/types/issue.type';
import { GqlJwtAuthGuard } from 'src/helpers/guards';
import { PaginationInput } from 'src/helpers/inputs';
import { CourseConnection } from 'src/helpers/types';
import { InstructorService } from '../services';
import { QuestionConnection, VersionResponse } from '../types';

@Resolver()
export class InstructorResolver {
  constructor(private readonly instructorService: InstructorService) {}
  // Queries
  @UseGuards(GqlJwtAuthGuard)
  @Query(() => ReviewTypeClass)
  getInstructorVersionReview(
    @Context() context,
    @Args('reviewId') reviewId: string,
  ) {
    const { email } = context.req.user;

    return this.instructorService.getVersionReview({
      email,
      reviewId,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => QuestionConnection)
  listInstructorQuestionsForVersion(
    @Context() context,
    @Args('versionId') versionId: string,
    @Args('searchTerm', { nullable: true }) searchTerm?: string,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    const { email } = context.req.user;

    return this.instructorService.listQuestionsForVersionPaginated({
      email,
      searchTerm,
      versionId,
      pagination,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => CourseTypeClass)
  getCourse(@Context() context, @Args('courseId') courseId: string) {
    const { email } = context.req.user;

    return this.instructorService.getCourse({
      email,
      courseId,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => VersionResponse)
  getInstructorCourseVersion(
    @Context() context,
    @Args('versionId') versionId: string,
  ) {
    const { email } = context.req.user;

    return this.instructorService.getCourseVersion({
      email,
      versionId,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => CourseConnection)
  listCourses(
    @Context() context,
    @Args('searchTerm', { nullable: true }) searchTerm?: string,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    const { email } = context.req.user;

    return this.instructorService.listCoursesPaginated({
      email,
      searchTerm,
      pagination,
    });
  }

  // Mutations
  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => IssueTypeClass)
  updateIssue(
    @Context() context,
    @Args('issueId') issueId: string,
    @Args('issueStatus', { type: () => IssueStatusType!, nullable: false })
    issueStatus: IssueStatusType,
    @Args('response') response: string,
  ) {
    const { email } = context.req.user;

    return this.instructorService.updateIssueStatus({
      email,
      issueId,
      issueStatus,
      response,
    });
  }
}
