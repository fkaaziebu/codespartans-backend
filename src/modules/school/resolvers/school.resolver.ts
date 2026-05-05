import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlJwtAuthGuard } from 'src/helpers/guards';
import { PaginationInput } from 'src/helpers/inputs';
import { AddSchoolStudentInput } from '../inputs/add-school-student.input';
import { BulkEnrollStudentsInput } from '../inputs/bulk-enroll-students.input';
import { LoginSchoolStudentInput } from '../inputs/login-school-student.input';
import { SchoolService } from '../services/school.service';
import {
  AddStudentResponse,
  EnrollStudentResult,
  LoginSchoolStudentResponse,
  SchoolStudentConnection,
  VerifyStudentUsernameResponse,
} from '../types';

@Resolver()
export class SchoolResolver {
  constructor(private readonly schoolService: SchoolService) {}

  // ─── Queries ─────────────────────────────────────────────────────────────────

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => SchoolStudentConnection)
  listSchoolStudents(
    @Context() context,
    @Args('searchTerm', { nullable: true }) searchTerm?: string,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    const { email } = context.req.user;
    return this.schoolService.listSchoolStudents(email, searchTerm, pagination);
  }

  // ─── Mutations (org-authenticated) ───────────────────────────────────────────

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => AddStudentResponse)
  addSchoolStudent(
    @Args('input') input: AddSchoolStudentInput,
    @Context() context,
  ) {
    const { email } = context.req.user;
    return this.schoolService.addSchoolStudent(email, input);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => [EnrollStudentResult])
  bulkEnrollStudents(
    @Args('input') input: BulkEnrollStudentsInput,
    @Context() context,
  ) {
    const { email } = context.req.user;
    return this.schoolService.bulkEnrollStudents(email, input.students);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => AddStudentResponse)
  resetStudentPin(
    @Args('studentId') studentId: string,
    @Context() context,
  ) {
    const { email } = context.req.user;
    return this.schoolService.resetStudentPin(email, studentId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => AddStudentResponse)
  shareStudentLogin(
    @Args('studentId') studentId: string,
    @Context() context,
  ) {
    const { email } = context.req.user;
    return this.schoolService.shareStudentLogin(email, studentId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => AddStudentResponse)
  removeSchoolStudent(
    @Args('studentId') studentId: string,
    @Context() context,
  ) {
    const { email } = context.req.user;
    return this.schoolService.removeSchoolStudent(email, studentId);
  }

  // ─── Mutations (public – student login flow) ──────────────────────────────────

  @Mutation(() => VerifyStudentUsernameResponse)
  verifySchoolStudentUsername(@Args('username') username: string) {
    return this.schoolService.verifyStudentUsername(username);
  }

  @Mutation(() => LoginSchoolStudentResponse)
  loginSchoolStudent(@Args('input') input: LoginSchoolStudentInput) {
    return this.schoolService.loginSchoolStudent(input.temp_token, input.pin);
  }
}
