import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Course,
  Instructor,
  Organization,
  Question,
  ReviewRequest,
  TestSuite,
  Version,
} from '../../../database/entities';
import { CourseTypeClass, VersionTypeClass } from '../../../database/types';
import { CourseInfoInput, QuestionInput } from '../inputs';

@Injectable()
export class InstructorService {
  constructor(
    @InjectRepository(Instructor)
    private instructorRepository: Repository<Instructor>,
  ) {}

  async createCourse({
    email,
    courseInfo,
    organizationId,
  }: {
    email: string;
    courseInfo: CourseInfoInput;
    organizationId: string;
  }): Promise<CourseTypeClass> {
    return await this.instructorRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const instructor = await transactionalEntityManager.findOne(
          Instructor,
          {
            where: { email },
          },
        );

        if (!instructor) {
          throw new NotFoundException('Instructor does not exist');
        }

        const organization = await transactionalEntityManager.findOne(
          Organization,
          {
            where: {
              id: organizationId,
              instructors: {
                id: instructor.id,
              },
            },
          },
        );

        if (!organization) {
          throw new NotFoundException(
            'Instructor does not belong to the organization',
          );
        }

        const newCourse = new Course();
        newCourse.avatar_url = courseInfo.avatar_url;
        newCourse.currency = courseInfo.currency;
        newCourse.description = courseInfo.description;
        newCourse.domains = courseInfo.domains;
        newCourse.level = courseInfo.level;
        newCourse.price = courseInfo.price;
        newCourse.title = courseInfo.title;
        newCourse.instructor = instructor;
        newCourse.organization = organization;

        return await transactionalEntityManager.save(newCourse);
      },
    );
  }

  async updateCourse({ email }: { email: string }): Promise<void> {
    // Implementation here
    // return { id: '1' };
  }

  async addCourseVersion({
    email,
    courseId,
  }: {
    email: string;
    courseId: string;
  }): Promise<VersionTypeClass> {
    return await this.instructorRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const instructor = await transactionalEntityManager.findOne(
          Instructor,
          {
            where: { email },
          },
        );

        if (!instructor) {
          throw new NotFoundException('Instructor does not exist');
        }

        const course = await transactionalEntityManager.findOne(Course, {
          where: {
            id: courseId,
          },
          relations: ['versions'],
        });

        if (!course) {
          throw new NotFoundException('Course not found');
        }

        const newVersion = new Version();
        newVersion.version_number = course.versions.length + 1;
        newVersion.course = course;

        return await transactionalEntityManager.save(newVersion);
      },
    );
  }

  async addQuestionsToCourseVersion({
    email,
    versionId,
    suiteTitle,
    suiteDescription,
    suiteKeywords,
    questions,
  }: {
    email: string;
    versionId: string;
    suiteTitle: string;
    suiteDescription: string;
    suiteKeywords: string[];
    questions: QuestionInput[];
  }): Promise<Version> {
    return await this.instructorRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const instructor = await transactionalEntityManager.findOne(
          Instructor,
          {
            where: { email },
          },
        );

        if (!instructor) {
          throw new NotFoundException('Instructor does not exist');
        }

        const courseVersion = await transactionalEntityManager.findOne(
          Version,
          {
            where: {
              id: versionId,
              course: {
                instructor: {
                  email,
                },
              },
            },
            relations: ['course'],
          },
        );

        if (!courseVersion) {
          throw new NotFoundException('Course version not found');
        }

        // Create a new test suite
        const new_suite = new TestSuite();
        new_suite.title = suiteTitle;
        new_suite.description = suiteDescription;
        new_suite.keywords = suiteKeywords;
        new_suite.course_version = courseVersion;

        await transactionalEntityManager.save(new_suite);

        // create questions
        const new_questions: Question[] = await Promise.all(
          questions.map(async (question) => {
            const new_question = new Question();
            new_question.correct_answer = question.correct_answer;
            new_question.description = question.description;
            new_question.difficulty = question.difficulty;
            new_question.estimated_time_in_ms = question.estimated_time_in_ms;
            new_question.hints = question.hints;
            new_question.options = question.options;
            new_question.question_number = question.question_number;
            new_question.solution_steps = question.solution_steps;
            new_question.tags = question.tags;
            new_question.type = question.type;
            new_question.version = courseVersion;
            new_question.test_suite = new_suite;

            return new_question;
          }),
        );

        const saved_questions =
          await transactionalEntityManager.save(new_questions);

        return { ...courseVersion, questions: saved_questions };
      },
    );
  }

  async updateQuestion({
    email,
    questionId,
    question,
  }: {
    email: string;
    questionId: string;
    question: QuestionInput;
  }): Promise<Question> {
    return await this.instructorRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const instructor = await transactionalEntityManager.findOne(
          Instructor,
          {
            where: { email },
          },
        );

        if (!instructor) {
          throw new NotFoundException('Instructor does not exist');
        }

        const questionToUpdate = await transactionalEntityManager.findOne(
          Question,
          {
            where: {
              id: questionId,
              version: {
                course: {
                  instructor: {
                    email,
                  },
                },
              },
            },
          },
        );

        if (!questionToUpdate) {
          throw new NotFoundException('Question not found');
        }

        // update question
        questionToUpdate.correct_answer =
          question.correct_answer || questionToUpdate.correct_answer;
        questionToUpdate.description =
          question.description || questionToUpdate.description;
        questionToUpdate.difficulty =
          question.difficulty || questionToUpdate.difficulty;
        questionToUpdate.estimated_time_in_ms =
          question.estimated_time_in_ms ||
          questionToUpdate.estimated_time_in_ms;
        questionToUpdate.hints = question.hints || questionToUpdate.hints;
        questionToUpdate.options = question.options || questionToUpdate.options;
        questionToUpdate.question_number =
          question.question_number || questionToUpdate.question_number;
        questionToUpdate.solution_steps =
          question.solution_steps || questionToUpdate.solution_steps;
        questionToUpdate.tags = question.tags || questionToUpdate.tags;
        questionToUpdate.type = question.type || questionToUpdate.type;

        return await transactionalEntityManager.save(questionToUpdate);
      },
    );
  }

  async requestCourseVersionReview({
    email,
    versionId,
  }: {
    email: string;
    versionId: string;
  }): Promise<ReviewRequest> {
    return await this.instructorRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const instructor = await transactionalEntityManager.findOne(
          Instructor,
          {
            where: { email },
          },
        );

        if (!instructor) {
          throw new NotFoundException('Instructor does not exist');
        }

        const courseVersion = await transactionalEntityManager.findOne(
          Version,
          {
            where: {
              id: versionId,
              course: {
                instructor: {
                  email,
                },
              },
            },
            relations: ['course.organization'],
          },
        );

        if (!courseVersion) {
          throw new NotFoundException('Course version not found');
        }

        const reviewRequest = new ReviewRequest();
        reviewRequest.course_version = courseVersion;
        reviewRequest.organization = courseVersion.course.organization;

        return await transactionalEntityManager.save(reviewRequest);
      },
    );
  }
}
