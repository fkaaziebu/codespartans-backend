import { Args, Query, Resolver } from '@nestjs/graphql';
import { AdminService } from '../services';
import { AdminLoginResponse } from '../types';

@Resolver()
export class AdminResolver {
  constructor(private readonly adminService: AdminService) {}
  // Queries
  @Query(() => AdminLoginResponse)
  async loginAdmin(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    return this.adminService.loginAdmin({ email, password });
  }
}
