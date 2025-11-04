import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { StudentService } from '../services/student.service';
import { RegisterResponse, StudentLoginResponse } from '../types';

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

  @Mutation(() => RegisterResponse)
  async registerStudent(
    @Args('name') name: string,
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('organizationId') organizationId: string,
  ) {
    return this.studentService.registerStudent({
      name,
      email,
      password,
      organizationId,
    });
  }
}
