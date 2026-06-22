import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Cart as CartTypeClass } from 'src/modules/inventory/entities/cart.entity';
import { Category as CategoryTypeClass } from 'src/modules/inventory/entities/category.entity';
import { Checkout as CheckoutTypeClass } from 'src/modules/inventory/entities/checkout.entity';
import { Course as CourseTypeClass } from 'src/modules/inventory/entities/course.entity';
import { Student as StudentTypeClass } from 'src/modules/auth/entities/student.entity';
import { Test as TestTypeClass } from 'src/modules/simulation/entities/test.entity';
import { GqlJwtAuthGuard, SubscriptionGuard } from 'src/helpers/guards';
import { PaginationInput } from 'src/helpers/inputs';
import { CourseConnection } from 'src/helpers/types';
import { SuiteType } from 'src/modules/review/entities/test_suite.entity';
import { AttemptFilterInput, CourseFilterInput } from '../inputs';
import { StudentService } from '../services';
import {
  AttemptConnection,
  CategoryCountdownResponse,
  StudentCourseResponse,
  StudentStatsResponse,
  SubjectProgressResponse,
  TestScoreHistoryResponse,
  TestSuiteConnection,
  TestTopicProgressResponse,
  WeakSubjectAreaResponse,
} from '../types';
import { StreakResponse } from '../../parent/types';

@Resolver()
export class StudentResolver {
  constructor(private readonly studentService: StudentService) {}

  // Queries
  @UseGuards(GqlJwtAuthGuard, SubscriptionGuard)
  @Query(() => StudentCourseResponse)
  getOrganizationCourse(
    @Context() context,
    @Args('courseId') courseId: string,
  ) {
    const { id } = context.req.user;

    return this.studentService.getOrganizationCourse({
      id,
      courseId,
    });
  }

  @UseGuards(
    GqlJwtAuthGuard,
    // , SubscriptionGuard
  )
  @Query(() => CourseConnection)
  listOrganizationCourses(
    @Context() context,
    @Args('organizationId', { nullable: true })
    organizationId?: string,
    @Args('searchTerm', { nullable: true }) searchTerm?: string,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: CourseFilterInput,
  ) {
    const { id } = context.req.user;

    return this.studentService.listOrganizationCoursesPaginated({
      id,
      organizationId,
      searchTerm,
      pagination,
      filter,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [CategoryTypeClass])
  listOrganizationCategories(
    @Context() context,
    @Args('searchTerm', { nullable: true }) searchTerm?: string,
  ) {
    const { id } = context.req.user;

    return this.studentService.listOrganizationCategories({
      id,
      searchTerm,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [CourseTypeClass])
  listCartCourses(@Context() context) {
    const { id } = context.req.user;

    return this.studentService.listCartCourses({
      id,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => AttemptConnection)
  listAttempts(
    @Context() context,
    @Args('searchTerm', { nullable: true }) searchTerm?: string,
    @Args('filter', { nullable: true }) filter?: AttemptFilterInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    const { id } = context.req.user;

    return this.studentService.listAttempts({
      id,
      searchTerm,
      filter,
      pagination,
    });
  }

  @UseGuards(GqlJwtAuthGuard, SubscriptionGuard)
  @Query(() => TestSuiteConnection)
  listCourseSuites(
    @Context() context,
    @Args('courseId') courseId: string,
    @Args('suiteTypes', { type: () => [SuiteType], nullable: true })
    suiteTypes?: SuiteType[],
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    const { id } = context.req.user;

    return this.studentService.listCourseSuitesPaginated({
      id,
      courseId,
      suiteTypes,
      pagination,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => TestTypeClass)
  getActiveTest(@Context() context) {
    const { id } = context.req.user;

    return this.studentService.getActiveTest({ id });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => TestTypeClass)
  getTest(@Context() context, @Args('testId') testId: string) {
    const { id } = context.req.user;

    return this.studentService.getTest({ id, testId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => StudentStatsResponse)
  getStudentStats(@Context() context) {
    const { id } = context.req.user;

    return this.studentService.getStats({ id });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => StreakResponse)
  getCurrentStreakCount(@Context() context) {
    const { id } = context.req.user;

    return this.studentService.getCurrentStreakCount({ id });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [SubjectProgressResponse])
  studentSubjectProgress(
    @Context() context,
    @Args('testId', { nullable: true }) testId?: string,
  ) {
    const { id } = context.req.user;

    return this.studentService.studentSubjectProgress({ id, testId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [TestTopicProgressResponse])
  studentTestTopicProgress(@Context() context, @Args('testId') testId: string) {
    const { id } = context.req.user;
    return this.studentService.studentTestTopicProgress({ id, testId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [WeakSubjectAreaResponse])
  weakSubjectAreas(
    @Context() context,
    @Args('testId', { nullable: true }) testId?: string,
  ) {
    const { id } = context.req.user;

    return this.studentService.weakSubjectAreas({ id, testId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [TestScoreHistoryResponse])
  getTestScoreHistory(
    @Context() context,
    @Args('testId', { nullable: true }) testId?: string,
  ) {
    const { id } = context.req.user;

    return this.studentService.getTestScoreHistory({ id, testId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [CategoryTypeClass])
  listCartCategories(@Context() context) {
    const { id } = context.req.user;

    return this.studentService.listCartCategories({
      id,
    });
  }

  // Mutations
  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => CartTypeClass)
  addCourseToCart(@Context() context, @Args('courseId') courseId: string) {
    const { id } = context.req.user;

    return this.studentService.addCourseToCart({ id, courseId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => StudentTypeClass)
  completeSetup(
    @Context() context,
    @Args('categoryId') categoryId: string,
    @Args('courseIds', { type: () => [String!]!, nullable: false })
    courseIds: string[],
  ) {
    const { id } = context.req.user;

    return this.studentService.completeSetup({ id, categoryId, courseIds });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => CartTypeClass)
  removeCourseFromCart(@Context() context, @Args('courseId') courseId: string) {
    const { id } = context.req.user;

    return this.studentService.removeCourseFromCart({ id, courseId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => CartTypeClass)
  addCategoryToCart(
    @Context() context,
    @Args('categoryId') categoryId: string,
  ) {
    const { id } = context.req.user;

    return this.studentService.addCategoryToCart({ id, categoryId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => StudentTypeClass)
  changeStudentPassword(
    @Context() context,
    @Args('currentPassword') currentPassword: string,
    @Args('newPassword') newPassword: string,
  ) {
    const { id } = context.req.user;

    return this.studentService.changeStudentPassword({
      id,
      currentPassword,
      newPassword,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => CheckoutTypeClass)
  createCheckout(
    @Context() context,
    @Args('autoApproveSubscription') autoApproveSubscription: boolean,
    @Args('checkoutFromCart', { nullable: true }) checkoutFromCart: boolean,
    @Args('courseId', { nullable: true }) courseId: string,
  ) {
    const { id } = context.req.user;

    return this.studentService.createCheckout({
      id,
      autoApproveSubscription,
      checkoutFromCart,
      courseId,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => CategoryCountdownResponse)
  getCategoryCountdown(@Args('categoryId') categoryId: string) {
    return this.studentService.getCategoryCountdown({ categoryId });
  }
}
