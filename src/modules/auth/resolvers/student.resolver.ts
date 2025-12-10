import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { StudentTypeClass } from 'src/database/types';
import { GqlJwtAuthGuard } from 'src/helpers/guards';
import { PaginationInput } from 'src/helpers/inputs';
import { StudentService } from '../services/student.service';
import {
  OrganizationConnection,
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
}
