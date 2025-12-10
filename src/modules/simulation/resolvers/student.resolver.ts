import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CourseTypeClass,
  QuestionTypeClass,
  SubmittedAnswerTypeClass,
  TestTypeClass,
} from 'src/database/types';
import { TestModeType } from 'src/database/types/test.type';
import { GqlJwtAuthGuard } from 'src/helpers/guards';
import { StudentService } from '../services';

@Resolver()
export class StudentResolver {
  constructor(private readonly studentService: StudentService) {}

  // Queries
  @UseGuards(GqlJwtAuthGuard)
  @Query(() => CourseTypeClass)
  getSubscribedCourseDetails(
    @Context() context,
    @Args('courseId') courseId: string,
  ) {
    const { email } = context.req.user;

    return this.studentService.getSubscribedCourseDetails({
      email,
      courseId,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => QuestionTypeClass)
  getQuestion(@Context() context, @Args('testId') testId: string) {
    const { email } = context.req.user;

    return this.studentService.getQuestion({
      email,
      testId,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => TestTypeClass)
  testStats(@Context() context, @Args('testId') testId: string) {
    const { email } = context.req.user;

    return this.studentService.testStats({ email, testId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [SubmittedAnswerTypeClass])
  getAllAttemptedQuestions(@Context() context, @Args('testId') testId: string) {
    const { email } = context.req.user;

    return this.studentService.getAllAttemptedQuestions({ email, testId });
  }

  // Mutations
  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => TestTypeClass)
  startTest(
    @Context() context,
    @Args('suiteId') suiteId: string,
    @Args('mode', { nullable: true }) mode?: TestModeType,
  ) {
    const { email } = context.req.user;

    return this.studentService.startTest({
      email,
      suiteId,
      mode,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => TestTypeClass)
  pauseTest(@Context() context, @Args('testId') testId: string) {
    const { email } = context.req.user;

    return this.studentService.pauseTest({
      email,
      testId,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => TestTypeClass)
  resumeTest(@Context() context, @Args('testId') testId: string) {
    const { email } = context.req.user;

    return this.studentService.resumeTest({
      email,
      testId,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => TestTypeClass)
  endTest(@Context() context, @Args('testId') testId: string) {
    const { email } = context.req.user;

    return this.studentService.endTest({
      email,
      testId,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => SubmittedAnswerTypeClass)
  submitAnswer(
    @Context() context,
    @Args('testId') testId: string,
    @Args('questionId') questionId: string,
    @Args('timeRange') timeRange: string,
    @Args('answer') answer: string,
    @Args('isFlagged') isFlagged: boolean,
  ) {
    const { email } = context.req.user;

    return this.studentService.submitAnswer({
      email,
      testId,
      questionId,
      timeRange,
      answer,
      isFlagged,
    });
  }
}
