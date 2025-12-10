import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CartTypeClass,
  CategoryTypeClass,
  CheckoutTypeClass,
  CourseTypeClass,
} from 'src/database/types';
import { GqlJwtAuthGuard } from 'src/helpers/guards';
import { PaginationInput } from 'src/helpers/inputs';
import { CourseConnection } from 'src/helpers/types';
import { CourseFilterInput } from '../inputs';
import { StudentService } from '../services';
import { StudentCourseResponse } from '../types';

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
  @Query(() => [CourseTypeClass])
  listCartCourses(@Context() context) {
    const { email } = context.req.user;

    return this.studentService.listCartCourses({
      email,
    });
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
