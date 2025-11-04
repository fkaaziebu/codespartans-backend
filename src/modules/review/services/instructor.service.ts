import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateHelper } from 'src/helpers';
import { PaginationInput } from 'src/helpers/inputs';
import { ILike, Repository } from 'typeorm';
import {
  Course,
  Instructor,
  Issue,
  Question,
  Review,
  Version,
} from '../../../database/entities';
import { IssueTypeClass } from '../../../database/types';
import { IssueStatusType } from '../../../database/types/issue.type';

@Injectable()
export class InstructorService {
  constructor(
    @InjectRepository(Instructor)
    private instructorRepository: Repository<Instructor>,
  ) {}

  async getVersionReview({
    email,
    reviewId,
  }: {
    email: string;
    reviewId: string;
  }): Promise<Review> {
    return this.instructorRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const review = await transactionalEntityManager.findOne(Review, {
          where: {
            id: reviewId,
            course_version: {
              course: {
                instructor: {
                  email,
                },
              },
            },
          },
          relations: [
            'course_version.questions',
            'course_version.course',
            'issues',
          ],
        });

        return review;
      },
    );
  }

  async listQuestionsForVersionPaginated({
    email,
    versionId,
    searchTerm,
    pagination,
  }: {
    email: string;
    versionId?: string;
    searchTerm?: string;
    pagination?: PaginationInput;
  }) {
    const questions = await this.listQuestionsForVersion({
      email,
      versionId,
      searchTerm,
    });

    // Apply pagination and return in the connection format
    return PaginateHelper.paginate<Question>(
      questions,
      pagination,
      (question) => question.id.toString(),
    );
  }

  async listQuestionsForVersion({
    email,
    versionId,
    searchTerm,
  }: {
    email: string;
    versionId: string;
    searchTerm?: string;
  }): Promise<Question[]> {
    return await this.instructorRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const questions = await transactionalEntityManager.find(Question, {
          where: {
            description: searchTerm
              ? ILike(`%${searchTerm.trim()}%`)
              : undefined,
            version: {
              id: versionId,
              course: {
                instructor: {
                  email,
                },
              },
            },
          },
        });

        return questions;
      },
    );
  }

  async getCourseVersion({
    email,
    versionId,
  }: {
    email: string;
    versionId: string;
  }): Promise<Version> {
    return this.instructorRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const version = await transactionalEntityManager.findOne(Version, {
          where: {
            id: versionId,
            course: {
              instructor: {
                email,
              },
            },
          },
          relations: [
            'questions',
            'reviews',
            'course.instructor',
            'review_request',
            'reviews.issues',
          ],
        });

        return {
          ...version,
          reviews: version.reviews.map((review) => ({
            ...review,
            total_issues: review.issues.filter(
              (issue) => issue.status !== IssueStatusType.CLOSED,
            ).length,
          })),
          total_questions: version.questions.length,
          total_reviews: version.reviews.length,
        };
      },
    );
  }

  async getCourse({
    email,
    courseId,
  }: {
    email: string;
    courseId: string;
  }): Promise<Course> {
    return await this.instructorRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const course = await transactionalEntityManager.findOne(Course, {
          where: {
            id: courseId,
            instructor: {
              email,
            },
          },
          relations: [
            'approved_version.questions',
            'approved_version.assigned_admin',
            'versions.questions',
            'versions.assigned_admin',
          ],
        });

        return course;
      },
    );
  }

  async listCoursesPaginated({
    email,
    searchTerm,
    pagination,
  }: {
    email: string;
    searchTerm?: string;
    pagination?: PaginationInput;
  }) {
    const courses = await this.listCourses({
      email,
      searchTerm,
    });

    // Apply pagination and return in the connection format
    return PaginateHelper.paginate<Course>(courses, pagination, (course) =>
      course.id.toString(),
    );
  }

  async listCourses({
    email,
    searchTerm,
  }: {
    email: string;
    searchTerm?: string;
  }): Promise<Course[]> {
    return await this.instructorRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const courses = await transactionalEntityManager.find(Course, {
          where: {
            title: searchTerm ? ILike(`%${searchTerm.trim()}%`) : undefined,
            instructor: {
              email,
            },
          },
          relations: ['approved_version', 'versions'],
        });

        return courses;
      },
    );
  }

  async updateIssueStatus({
    email,
    issueId,
    issueStatus,
    response,
  }: {
    email: string;
    issueId: string;
    issueStatus: IssueStatusType;
    response: string;
  }): Promise<IssueTypeClass> {
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

        const issue = await transactionalEntityManager.findOne(Issue, {
          where: {
            id: issueId,
            review: {
              course_version: {
                course: {
                  instructor: {
                    email,
                  },
                },
              },
            },
          },
        });

        if (!issue) {
          throw new NotFoundException('Issue not found');
        }

        issue.status = issueStatus;
        issue.response = response;

        return await transactionalEntityManager.save(Issue, issue);
      },
    );
  }
}
