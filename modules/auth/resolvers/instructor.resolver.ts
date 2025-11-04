import { Args, Query, Resolver } from '@nestjs/graphql';
import { InstructorService } from '../services/instructor.service';
import { InstructorLoginResponse } from '../types';

@Resolver()
export class InstructorResolver {
  constructor(private readonly instructorService: InstructorService) {}
  // Queries
  @Query(() => InstructorLoginResponse)
  async loginInstructor(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    return this.instructorService.loginInstructor({ email, password });
  }
}
