import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlJwtAuthGuard } from 'src/helpers/guards';
import { ActivateParentDemoInput } from '../inputs/activate-parent-demo.input';
import { ActivateSchoolDemoInput } from '../inputs/activate-school-demo.input';
import { ActivateStudentDemoInput } from '../inputs/activate-student-demo.input';
import { BookParentFreeDemoInput } from '../inputs/book-parent-free-demo.input';
import { BookSchoolFreeDemoInput } from '../inputs/book-school-free-demo.input';
import { BookStudentFreeDemoInput } from '../inputs/book-student-free-demo.input';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { DemoService } from '../services/demo.service';
import { ActivateDemoResponse } from '../types/activate-demo-response.type';
import { ActivateUserDemoResponse } from '../types/activate-user-demo-response.type';
import { BookDemoResponse } from '../types/book-demo-response.type';
import { InitiatePaymentResponse } from '../types/initiate-payment-response.type';
import { LoginParentResponse } from 'src/modules/parent/types';
import { StudentLoginResponse } from 'src/modules/auth/types';
import { ParentSubscription } from 'src/modules/parent/entities/parent-subscription.entity';
import { StudentSubscription } from '../entities/student-subscription.entity';

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

  @Mutation(() => StudentLoginResponse)
  async activateStudentDemo(@Args('input') input: ActivateStudentDemoInput) {
    return this.demoService.activateStudentDemo(input);
  }

  @Mutation(() => LoginParentResponse)
  async activateParentDemo(@Args('input') input: ActivateParentDemoInput) {
    return this.demoService.activateParentDemo(input);
  }

  @Query(() => [SubscriptionPlan])
  async listSubscriptionPlans() {
    return this.demoService.listPlans();
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => InitiatePaymentResponse)
  async initiatePayment(
    @Args('planId') planId: string,
    @Args('children', { type: () => [String] }) children: string[],
    @Context() context,
  ) {
    const { email, role } = context.req.user;
    return this.demoService.initiatePayment(email, planId, role, children);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => ParentSubscription, { nullable: true })
  async getMySubscription(@Context() context) {
    const { email } = context.req.user;
    return this.demoService.getMySubscription(email);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [ParentSubscription])
  async listMySubscriptions(@Context() context) {
    const { email } = context.req.user;
    return this.demoService.listMySubscriptions(email);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => StudentSubscription, { nullable: true })
  async getMyStudentSubscription(@Context() context) {
    const { email } = context.req.user;
    return this.demoService.getMyStudentSubscription(email);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [StudentSubscription])
  async listMyStudentSubscriptions(@Context() context) {
    const { email } = context.req.user;
    return this.demoService.listMyStudentSubscriptions(email);
  }
}
