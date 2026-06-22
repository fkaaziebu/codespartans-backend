import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateHelper } from '../../../helpers';
import { PaginationInput } from '../../../helpers/inputs';
import { ILike, Repository } from 'typeorm';
import { Instructor } from '../../auth/entities/instructor.entity';
import { Course } from '../../inventory/entities/course.entity';
import { Issue } from '../entities/issue.entity';
import { Question } from '../entities/question.entity';
import { Review } from '../entities/review.entity';
import { Version } from '../entities/version.entity';
import { Issue as IssueTypeClass, IssueStatusType } from '../entities/issue.entity';

@Injectable()
export class InstructorService {
  constructor(
    @InjectRepository(Instructor)
    private instructorRepository: Repository<Instructor>,
  ) {}

  async getVersionReview({
    id,
    reviewId,
  }: {
    id: string;
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
                  id,
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
    id,
    versionId,
    searchTerm,
    pagination,
  }: {
    id: string;
    versionId?: string;
    searchTerm?: string;
    pagination?: PaginationInput;
  }) {
    const questions = await this.listQuestionsForVersion({
      id,
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
    id,
    versionId,
    searchTerm,
  }: {
    id: string;
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
                  id,
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
    id,
    versionId,
  }: {
    id: string;
    versionId: string;
  }): Promise<Version> {
    return this.instructorRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const version = await transactionalEntityManager.findOne(Version, {
          where: {
            id: versionId,
            course: {
              instructor: {
                id,
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
    id,
    courseId,
  }: {
    id: string;
    courseId: string;
  }): Promise<Course> {
    return await this.instructorRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const course = await transactionalEntityManager.findOne(Course, {
          where: {
            id: courseId,
            instructor: {
              id,
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
    id,
    searchTerm,
    pagination,
  }: {
    id: string;
    searchTerm?: string;
    pagination?: PaginationInput;
  }) {
    const courses = await this.listCourses({
      id,
      searchTerm,
    });

    // Apply pagination and return in the connection format
    return PaginateHelper.paginate<Course>(courses, pagination, (course) =>
      course.id.toString(),
    );
  }

  async listCourses({
    id,
    searchTerm,
  }: {
    id: string;
    searchTerm?: string;
  }): Promise<Course[]> {
    return await this.instructorRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const courses = await transactionalEntityManager.find(Course, {
          where: {
            title: searchTerm ? ILike(`%${searchTerm.trim()}%`) : undefined,
            instructor: {
              id,
            },
          },
          relations: ['approved_version', 'versions'],
        });

        return courses;
      },
    );
  }

  async updateIssueStatus({
    id,
    issueId,
    issueStatus,
    response,
  }: {
    id: string;
    issueId: string;
    issueStatus: IssueStatusType;
    response: string;
  }): Promise<IssueTypeClass> {
    return await this.instructorRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const instructor = await transactionalEntityManager.findOne(
          Instructor,
          {
            where: { id },
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
                    id,
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

        return transactionalEntityManager.save(Issue, issue);
      },
    );
  }
}
