import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AdminTypeClass, InstructorTypeClass } from 'src/database/types';
import { GqlJwtAuthGuard } from 'src/helpers/guards';
import { OrganizationService } from '../services';
import { OrganizationLoginResponse, RegisterResponse } from '../types';

@Resolver()
export class OrganizationResolver {
  constructor(private readonly organizationService: OrganizationService) {}
  // Queries
  @Query(() => OrganizationLoginResponse)
  async loginOrganization(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    return this.organizationService.loginOrganization({ email, password });
  }

  // Mutations
  @Mutation(() => RegisterResponse)
  async registerOrganization(
    @Args('name') name: string,
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    return this.organizationService.registerOrganization({
      name,
      email,
      password,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => InstructorTypeClass)
  async registerInstructor(
    @Context() context,
    @Args('name') name: string,
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    const { email: orgEmail } = context.req.user;
    return this.organizationService.registerInstructor({
      organizationEmail: orgEmail,
      name,
      email,
      password,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => AdminTypeClass)
  async registerAdmin(
    @Context() context,
    @Args('name') name: string,
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    const { email: orgEmail } = context.req.user;

    return this.organizationService.registerAdmin({
      organizationEmail: orgEmail,
      name,
      email,
      password,
    });
  }
}
