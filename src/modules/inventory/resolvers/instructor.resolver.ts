import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import {
  CourseTypeClass,
  QuestionTypeClass,
  ReviewRequestTypeClass,
  VersionTypeClass,
} from 'src/database/types';
import { GqlJwtAuthGuard } from 'src/helpers/guards';
import {
  CourseInfoInput,
  QuestionInput,
  UpdateCourseInfoInput,
} from '../inputs';
import { InstructorService } from '../services';

@Resolver()
export class InstructorResolver {
  constructor(private readonly instructorService: InstructorService) {}

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => CourseTypeClass)
  createCourse(
    @Context() context,
    @Args('organizationId') organizationId: string,
    @Args('courseInfo', { type: () => CourseInfoInput!, nullable: false })
    courseInfo: CourseInfoInput,
  ) {
    const { email } = context.req.user;
    return this.instructorService.createCourse({
      email,
      courseInfo,
      organizationId,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => CourseTypeClass)
  updateCourse(
    @Context() context,
    @Args('courseId') courseId: string,
    @Args('courseInfo', { type: () => UpdateCourseInfoInput!, nullable: false })
    courseInfo: UpdateCourseInfoInput,
  ) {
    const { email } = context.req.user;
    return this.instructorService.updateCourse({ email });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => VersionTypeClass)
  addCourseVersion(@Context() context, @Args('courseId') courseId: string) {
    const { email } = context.req.user;
    return this.instructorService.addCourseVersion({ email, courseId });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => VersionTypeClass)
  addQuestionsToCourseVersion(
    @Context() context,
    @Args('versionId') versionId: string,
    @Args('suiteTitle') suiteTitle: string,
    @Args('suiteDescription') suiteDescription: string,
    @Args('suiteKeywords', { type: () => [String!]! }) suiteKeywords: string[],
    @Args('questions', { type: () => [QuestionInput!]!, nullable: false })
    questions: QuestionInput[],
  ) {
    const { email } = context.req.user;

    return this.instructorService.addQuestionsToCourseVersion({
      email,
      versionId,
      suiteTitle,
      suiteDescription,
      suiteKeywords,
      questions,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => QuestionTypeClass)
  updateQuestion(
    @Context() context,
    @Args('questionId') questionId: string,
    @Args('question', { type: () => QuestionInput! })
    question: QuestionInput,
  ) {
    const { email } = context.req.user;

    return this.instructorService.updateQuestion({
      email,
      questionId,
      question,
    });
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => ReviewRequestTypeClass)
  requestCourseVersionReview(
    @Context() context,
    @Args('versionId') versionId: string,
  ) {
    const { email } = context.req.user;

    return this.instructorService.requestCourseVersionReview({
      email,
      versionId,
    });
  }
}
