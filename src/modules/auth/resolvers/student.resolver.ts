import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Student as StudentTypeClass } from 'src/database/entities/student.entity';
import { GqlJwtAuthGuard } from 'src/helpers/guards';
import { PaginationInput } from 'src/helpers/inputs';
import { StudentService } from '../services/student.service';
import {
  OrganizationConnection,
  PasswordResetResponse,
  RefreshTokenResponse,
  RegisterResponse,
  StudentLoginResponse,
} from '../types';

@Resolver()
export class StudentResolver {
  constructor(private readonly studentService: StudentService) {}
  // Queries
  @Query(() => StudentLoginResponse)
  async loginStudent(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    return this.studentService.loginStudent({
      email,
      password,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => StudentTypeClass)
  async studentProfile(@Context() context) {
    const { email } = context.req.user;
    return this.studentService.studentProfile({ email });
  }

  @Query(() => OrganizationConnection)
  async listOrganizations(
    @Args('searchTerm', { nullable: true }) searchTerm?: string,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    return this.studentService.listOrganizationsPaginated({
      searchTerm,
      pagination,
    });
  }

  // Mutations
  @Mutation(() => RegisterResponse)
  async registerStudent(
    @Args('name') name: string,
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    return this.studentService.registerStudent({
      name,
      email,
      password,
    });
  }

  @Mutation(() => RefreshTokenResponse)
  async refreshStudentToken(@Args('refresh_token') refresh_token: string) {
    return this.studentService.refreshStudentToken({ refresh_token });
  }

  @Mutation(() => PasswordResetResponse)
  async completeStudentAccountValidation(
    @Args('email') email: string,
    @Args('validation_code') validation_code: string,
  ) {
    return this.studentService.completeStudentAccountValidation({
      email,
      validation_code,
    });
  }

  @Mutation(() => PasswordResetResponse)
  async resendAccountValidationCode(@Args('email') email: string) {
    return this.studentService.resendAccountValidationCode({ email });
  }

  @Mutation(() => PasswordResetResponse)
  async requestStudentPasswordReset(@Args('email') email: string) {
    return this.studentService.requestStudentPasswordReset({
      email,
    });
  }

  @Mutation(() => PasswordResetResponse)
  async resetStudentPassword(
    @Args('email') email: string,
    @Args('token') token: string,
    @Args('password') password: string,
  ) {
    return this.studentService.resetStudentPassword({
      email,
      token,
      password,
    });
  }
}
