import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CartTypeClass,
  CategoryTypeClass,
  CheckoutTypeClass,
  CourseTypeClass,
  StudentTypeClass,
  TestTypeClass,
} from 'src/database/types';
import { GqlJwtAuthGuard } from 'src/helpers/guards';
import { PaginationInput } from 'src/helpers/inputs';
import { CourseConnection } from 'src/helpers/types';
import { AttemptFilterInput, CourseFilterInput } from '../inputs';
import { StudentService } from '../services';
import {
  AttemptConnection,
  StudentCourseResponse,
  StudentStatsResponse,
  SubjectProgressResponse,
  TestScoreHistoryResponse,
  WeakSubjectAreaResponse,
} from '../types';

@Resolver()
export class StudentResolver {
  constructor(private readonly studentService: StudentService) {}

  // Queries
  @UseGuards(GqlJwtAuthGuard)
  @Query(() => StudentCourseResponse)
  getOrganizationCourse(
    @Context() context,
    @Args('courseId') courseId: string,
  ) {
    const { email } = context.req.user;

    return this.studentService.getOrganizationCourse({
      email,
      courseId,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => CourseConnection)
  listOrganizationCourses(
    @Context() context,
    @Args('organizationId', { nullable: true })
    organizationId?: string,
    @Args('searchTerm', { nullable: true }) searchTerm?: string,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: CourseFilterInput,
  ) {
    const { email } = context.req.user;

    return this.studentService.listOrganizationCoursesPaginated({
      email,
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
    const { email } = context.req.user;

    return this.studentService.listOrganizationCategories({
      email,
      searchTerm,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [CourseTypeClass])
  listCartCourses(@Context() context) {
    const { email } = context.req.user;

    return this.studentService.listCartCourses({
      email,
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
    const { email } = context.req.user;

    return this.studentService.listAttempts({
      email,
      searchTerm,
      filter,
      pagination,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => TestTypeClass)
  getActiveTest(@Context() context) {
    const { email } = context.req.user;

    return this.studentService.getActiveTest({ email });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => TestTypeClass)
  getTest(@Context() context, @Args('testId') testId: string) {
    const { email } = context.req.user;

    return this.studentService.getTest({ email, testId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => StudentStatsResponse)
  getStudentStats(@Context() context) {
    const { email } = context.req.user;

    return this.studentService.getStats({ email });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [SubjectProgressResponse])
  studentSubjectProgress(
    @Context() context,
    @Args('testId', { nullable: true }) testId?: string,
  ) {
    const { email } = context.req.user;

    return this.studentService.studentSubjectProgress({ email, testId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [WeakSubjectAreaResponse])
  weakSubjectAreas(
    @Context() context,
    @Args('testId', { nullable: true }) testId?: string,
  ) {
    const { email } = context.req.user;

    return this.studentService.weakSubjectAreas({ email, testId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [TestScoreHistoryResponse])
  getTestScoreHistory(
    @Context() context,
    @Args('testId', { nullable: true }) testId?: string,
  ) {
    const { email } = context.req.user;

    return this.studentService.getTestScoreHistory({ email, testId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [CategoryTypeClass])
  listCartCategories(@Context() context) {
    const { email } = context.req.user;

    return this.studentService.listCartCategories({
      email,
    });
  }

  // Mutations
  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => CartTypeClass)
  addCourseToCart(@Context() context, @Args('courseId') courseId: string) {
    const { email } = context.req.user;

    return this.studentService.addCourseToCart({ email, courseId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => StudentTypeClass)
  completeSetup(
    @Context() context,
    @Args('categoryId') categoryId: string,
    @Args('courseIds', { type: () => [String!]!, nullable: false })
    courseIds: string[],
  ) {
    const { email } = context.req.user;

    return this.studentService.completeSetup({ email, categoryId, courseIds });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => CartTypeClass)
  removeCourseFromCart(@Context() context, @Args('courseId') courseId: string) {
    const { email } = context.req.user;

    return this.studentService.removeCourseFromCart({ email, courseId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => CartTypeClass)
  addCategoryToCart(
    @Context() context,
    @Args('categoryId') categoryId: string,
  ) {
    const { email } = context.req.user;

    return this.studentService.addCategoryToCart({ email, categoryId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => StudentTypeClass)
  changeStudentPassword(
    @Context() context,
    @Args('currentPassword') currentPassword: string,
    @Args('newPassword') newPassword: string,
  ) {
    const { email } = context.req.user;

    return this.studentService.changeStudentPassword({
      email,
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
    const { email } = context.req.user;

    return this.studentService.createCheckout({
      email,
      autoApproveSubscription,
      checkoutFromCart,
      courseId,
    });
  }
}
