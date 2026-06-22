import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Course as CourseTypeClass } from 'src/modules/inventory/entities/course.entity';
import { Issue as IssueTypeClass, IssueStatusType } from 'src/modules/review/entities/issue.entity';
import { Review as ReviewTypeClass } from 'src/modules/review/entities/review.entity';
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
    const { id } = context.req.user;

    return this.instructorService.getVersionReview({
      id,
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
    const { id } = context.req.user;

    return this.instructorService.listQuestionsForVersionPaginated({
      id,
      searchTerm,
      versionId,
      pagination,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => CourseTypeClass)
  getCourse(@Context() context, @Args('courseId') courseId: string) {
    const { id } = context.req.user;

    return this.instructorService.getCourse({
      id,
      courseId,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => VersionResponse)
  getInstructorCourseVersion(
    @Context() context,
    @Args('versionId') versionId: string,
  ) {
    const { id } = context.req.user;

    return this.instructorService.getCourseVersion({
      id,
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
    const { id } = context.req.user;

    return this.instructorService.listCoursesPaginated({
      id,
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
    const { id } = context.req.user;

    return this.instructorService.updateIssueStatus({
      id,
      issueId,
      issueStatus,
      response,
    });
  }
}
