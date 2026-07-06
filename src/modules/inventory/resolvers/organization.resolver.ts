import { UseGuards } from '@nestjs/common';
import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Category as CategoryTypeClass } from 'src/modules/inventory/entities/category.entity';
import { Course as CourseTypeClass } from 'src/modules/inventory/entities/course.entity';
import { TestSuite as TestSuiteTypeClass } from 'src/modules/review/entities/test_suite.entity';
import { Version as VersionTypeClass } from 'src/modules/review/entities/version.entity';
import { GqlJwtAuthGuard } from 'src/helpers/guards';
import { PaginationInput } from 'src/helpers/inputs';
import { CourseConnection } from 'src/helpers/types';
import {
  CategoryCourseInfoInput,
  CategoryInfoInput,
  RequestedReviewFilterInput,
  SuiteInput,
} from '../inputs';
import { OrganizationService } from '../services';
import {
  AdminConnection,
  InstructorConnection,
  RequestedReviewConnection,
  StatsResponse,
} from '../types';

@Resolver()
export class OrganizationResolver {
  constructor(private readonly organizationService: OrganizationService) {}
  // Queries
  @UseGuards(GqlJwtAuthGuard)
  @Query(() => StatsResponse)
  getStats(@Context() context) {
    const { id } = context.req.user;

    return this.organizationService.getStats({
      id,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => InstructorConnection)
  listInstructors(
    @Context() context,
    @Args('searchTerm', { nullable: true }) searchTerm?: string,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    const { id } = context.req.user;

    return this.organizationService.listInstructorsPaginated({
      id,
      searchTerm,
      pagination,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => AdminConnection)
  listAdmins(
    @Context() context,
    @Args('searchTerm', { nullable: true }) searchTerm?: string,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    const { id } = context.req.user;

    return this.organizationService.listAdminsPaginated({
      id,
      searchTerm,
      pagination,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => RequestedReviewConnection)
  listRequestedReviews(
    @Context() context,
    @Args('filter', { nullable: true }) filter?: RequestedReviewFilterInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    const { id } = context.req.user;

    return this.organizationService.listRequestedReviewsPaginated({
      id,
      filter,
      pagination,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => CourseConnection)
  listCoursesForOrganization(
    @Context() context,
    @Args('searchTerm', { nullable: true }) searchTerm?: string,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    const { id } = context.req.user;

    return this.organizationService.listCoursesPaginated({
      id,
      searchTerm,
      pagination,
    });
  }

  // Mutations
  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => VersionTypeClass)
  assignCourseVersionForReview(
    @Context() context,
    @Args('versionId') versionId: string,
    @Args('adminId') adminId: string,
  ) {
    const { id } = context.req.user;

    return this.organizationService.assignCourseVersionForReview({
      id,
      versionId,
      adminId,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => CategoryTypeClass)
  createCategory(
    @Context() context,
    @Args('categoryInfo', { type: () => CategoryInfoInput!, nullable: false })
    categoryInfo: CategoryInfoInput,
  ) {
    const { id } = context.req.user;

    return this.organizationService.createCategory({ id, categoryInfo });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => CategoryTypeClass)
  addCoursesToCategory(
    @Context() context,
    @Args('categoryId') categoryId: string,
    @Args('courseIds', { type: () => [String!]!, nullable: false })
    courseIds: string[],
  ) {
    const { id } = context.req.user;

    return this.organizationService.addCoursesToCategory({
      id,
      categoryId,
      courseIds,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => CourseTypeClass)
  createCategoryCourse(
    @Context() context,
    @Args('categoryId') categoryId: string,
    @Args('courseInfo', {
      type: () => CategoryCourseInfoInput!,
      nullable: false,
    })
    courseInfo: CategoryCourseInfoInput,
  ) {
    const { id } = context.req.user;

    return this.organizationService.createCategoryCourse({
      id,
      categoryId,
      courseInfo,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => [TestSuiteTypeClass])
  addSuitesToCourse(
    @Context() context,
    @Args('courseId') courseId: string,
    @Args('suites', { type: () => [SuiteInput!]!, nullable: false })
    suites: SuiteInput[],
  ) {
    const { id } = context.req.user;

    return this.organizationService.addSuitesToCourse({
      id,
      courseId,
      suites,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Boolean)
  updateCategoryCountdown(
    @Context() context,
    @Args('categoryId') categoryId: string,
    @Args('dateOfExams') dateOfExams: Date,
    @Args('examDurationDays', { type: () => Int }) examDurationDays: number,
  ) {
    const { id } = context.req.user;

    return this.organizationService.updateCategoryCountdown({
      id,
      categoryId,
      dateOfExams,
      examDurationDays,
    });
  }
}
