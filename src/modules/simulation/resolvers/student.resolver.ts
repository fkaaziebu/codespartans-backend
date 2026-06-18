import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Course as CourseTypeClass } from 'src/modules/inventory/entities/course.entity';
import { SuiteFilterInput } from 'src/modules/inventory/inputs';
import { Question as QuestionTypeClass } from 'src/modules/review/entities/question.entity';
import { SubmittedAnswer as SubmittedAnswerTypeClass } from 'src/modules/simulation/entities/sumitted_answer.entity';
import {
  Test as TestTypeClass,
  TestModeType,
} from 'src/modules/simulation/entities/test.entity';
import { TestAssignment } from 'src/modules/simulation/entities/test_assignment.entity';
import { GqlJwtAuthGuard, SubscriptionGuard } from 'src/helpers/guards';
import { InsightService, StudentService } from '../services';
import { WeeklyInsight } from '../types/weekly-insight.type';

@Resolver()
export class StudentResolver {
  constructor(
    private readonly studentService: StudentService,
    private readonly insightService: InsightService,
  ) {}

  // Queries
  @UseGuards(GqlJwtAuthGuard, SubscriptionGuard)
  @Query(() => CourseTypeClass)
  getSubscribedCourseDetails(
    @Context() context,
    @Args('courseId') courseId: string,
    @Args('filter', { type: () => SuiteFilterInput, nullable: true })
    filter?: SuiteFilterInput,
  ) {
    const { id } = context.req.user;

    return this.studentService.getSubscribedCourseDetails({
      id,
      courseId,
      filter,
    });
  }

  @UseGuards(GqlJwtAuthGuard, SubscriptionGuard)
  @Query(() => QuestionTypeClass)
  getQuestion(@Context() context, @Args('testId') testId: string) {
    const { id } = context.req.user;

    return this.studentService.getQuestion({
      id,
      testId,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => WeeklyInsight, { nullable: true })
  getWeeklyInsight(@Context() context) {
    const { id } = context.req.user;
    return this.insightService.getWeeklyInsight({ id });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => TestTypeClass)
  testStats(@Context() context, @Args('testId') testId: string) {
    const { id } = context.req.user;

    return this.studentService.testStats({ id, testId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [SubmittedAnswerTypeClass])
  getAllAttemptedQuestions(@Context() context, @Args('testId') testId: string) {
    const { id } = context.req.user;

    return this.studentService.getAllAttemptedQuestions({ id, testId });
  }

  // Mutations
  @UseGuards(GqlJwtAuthGuard, SubscriptionGuard)
  @Mutation(() => TestTypeClass)
  startTest(
    @Context() context,
    @Args('suiteId') suiteId: string,
    @Args('mode', { type: () => TestModeType, nullable: true })
    mode?: TestModeType,
  ) {
    const { id } = context.req.user;

    return this.studentService.startTest({
      id,
      suiteId,
      mode,
    });
  }

  @UseGuards(GqlJwtAuthGuard, SubscriptionGuard)
  @Mutation(() => TestTypeClass)
  pauseTest(@Context() context, @Args('testId') testId: string) {
    const { id } = context.req.user;

    return this.studentService.pauseTest({
      id,
      testId,
    });
  }

  @UseGuards(GqlJwtAuthGuard, SubscriptionGuard)
  @Mutation(() => TestTypeClass)
  resumeTest(@Context() context, @Args('testId') testId: string) {
    const { id } = context.req.user;

    return this.studentService.resumeTest({
      id,
      testId,
    });
  }

  @UseGuards(GqlJwtAuthGuard, SubscriptionGuard)
  @Mutation(() => TestTypeClass)
  endTest(@Context() context, @Args('testId') testId: string) {
    const { id } = context.req.user;

    return this.studentService.endTest({
      id,
      testId,
    });
  }

  @UseGuards(GqlJwtAuthGuard, SubscriptionGuard)
  @Mutation(() => SubmittedAnswerTypeClass)
  submitAnswer(
    @Context() context,
    @Args('testId') testId: string,
    @Args('questionId') questionId: string,
    @Args('timeRange') timeRange: string,
    @Args('answer') answer: string,
    @Args('isFlagged') isFlagged: boolean,
  ) {
    const { id } = context.req.user;

    return this.studentService.submitAnswer({
      id,
      testId,
      questionId,
      timeRange,
      answer,
      isFlagged,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [TestAssignment])
  listMyAssignments(@Context() context) {
    const { id } = context.req.user;
    return this.studentService.listMyAssignments({ id });
  }

  @UseGuards(GqlJwtAuthGuard, SubscriptionGuard)
  @Mutation(() => TestTypeClass)
  startAssignedTest(
    @Context() context,
    @Args('assignmentId') assignmentId: string,
    @Args('mode', { type: () => TestModeType, nullable: true })
    mode?: TestModeType,
  ) {
    const { id } = context.req.user;
    return this.studentService.startAssignedTest({ id, assignmentId, mode });
  }
}
