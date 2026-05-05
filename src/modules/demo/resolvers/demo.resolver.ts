import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlJwtAuthGuard } from 'src/helpers/guards';
import { ActivateSchoolDemoInput } from '../inputs/activate-school-demo.input';
import { BookParentFreeDemoInput } from '../inputs/book-parent-free-demo.input';
import { BookSchoolFreeDemoInput } from '../inputs/book-school-free-demo.input';
import { BookStudentFreeDemoInput } from '../inputs/book-student-free-demo.input';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { DemoService } from '../services/demo.service';
import { ActivateDemoResponse } from '../types/activate-demo-response.type';
import { BookDemoResponse } from '../types/book-demo-response.type';
import { InitiatePaymentResponse } from '../types/initiate-payment-response.type';

@Resolver()
export class DemoResolver {
  constructor(private readonly demoService: DemoService) {}

  @Mutation(() => BookDemoResponse)
  async bookSchoolFreeDemo(@Args('input') input: BookSchoolFreeDemoInput) {
    return this.demoService.bookSchoolFreeDemo(input);
  }

  @Mutation(() => BookDemoResponse)
  async bookParentFreeDemo(@Args('input') input: BookParentFreeDemoInput) {
    return this.demoService.bookParentFreeDemo(input);
  }

  @Mutation(() => BookDemoResponse)
  async bookStudentFreeDemo(@Args('input') input: BookStudentFreeDemoInput) {
    return this.demoService.bookStudentFreeDemo(input);
  }

  @Mutation(() => ActivateDemoResponse)
  async activateSchoolDemo(@Args('input') input: ActivateSchoolDemoInput) {
    return this.demoService.activateSchoolDemo(input);
  }

  @Query(() => [SubscriptionPlan])
  async listSubscriptionPlans() {
    return this.demoService.listPlans();
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => InitiatePaymentResponse)
  async initiatePayment(
    @Args('planId') planId: string,
    @Context() context,
  ) {
    const { email } = context.req.user;
    return this.demoService.initiatePayment(email, planId);
  }
}
