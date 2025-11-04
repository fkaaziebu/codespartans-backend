import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CategoryTypeClass, VersionTypeClass } from 'src/database/types';
import { GqlJwtAuthGuard } from 'src/helpers/guards';
import { PaginationInput } from 'src/helpers/inputs';
import { CategoryInfoInput, RequestedReviewFilterInput } from '../inputs';
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
    const { email } = context.req.user;

    return this.organizationService.getStats({
      email,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => InstructorConnection)
  listInstructors(
    @Context() context,
    @Args('searchTerm', { nullable: true }) searchTerm?: string,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    const { email } = context.req.user;

    return this.organizationService.listInstructorsPaginated({
      email,
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
    const { email } = context.req.user;

    return this.organizationService.listAdminsPaginated({
      email,
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
    const { email } = context.req.user;

    return this.organizationService.listRequestedReviewsPaginated({
      email,
      filter,
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
    const { email } = context.req.user;

    return this.organizationService.assignCourseVersionForReview({
      email,
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
    const { email } = context.req.user;

    return this.organizationService.createCategory({ email, categoryInfo });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => CategoryTypeClass)
  addCoursesToCategory(
    @Context() context,
    @Args('categoryId') categoryId: string,
    @Args('courseIds', { type: () => [String!]!, nullable: false })
    courseIds: string[],
  ) {
    const { email } = context.req.user;

    return this.organizationService.addCoursesToCategory({
      email,
      categoryId,
      courseIds,
    });
  }
}
