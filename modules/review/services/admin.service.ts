import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VersionStatusType } from 'src/database/types/version.type';
import { PaginateHelper } from 'src/helpers';
import { PaginationInput } from 'src/helpers/inputs';
import { ILike, Repository } from 'typeorm';
import {
  Admin,
  Course,
  Issue,
  Question,
  Review,
  Version,
} from '../../../database/entities';
import {
  IssueTypeClass,
  ReviewTypeClass,
  VersionTypeClass,
} from '../../../database/types';
import { IssueStatusType } from '../../../database/types/issue.type';
import { ReviewStatusType } from '../../../database/types/review.type';
import { IssueInfoInput, ReviewInfoInput } from '../inputs';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {}

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
    return await this.adminRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const questions = await transactionalEntityManager.find(Question, {
          where: {
            description: searchTerm
              ? ILike(`%${searchTerm.trim()}%`)
              : undefined,
            version: {
              id: versionId,
              assigned_admin: {
                email,
              },
            },
          },
        });

        return questions;
      },
    );
  }

  async listAssignedVersionsPaginated({
    email,
    searchTerm,
    pagination,
  }: {
    email: string;
    searchTerm?: string;
    pagination?: PaginationInput;
  }) {
    const versions = await this.listAssignedVersions({
      email,
      searchTerm,
    });

    // Apply pagination and return in the connection format
    return PaginateHelper.paginate<Version>(versions, pagination, (version) =>
      version.id.toString(),
    );
  }

  async listAssignedVersions({
    email,
    searchTerm,
  }: {
    email: string;
    searchTerm: string;
  }): Promise<Version[]> {
    return this.adminRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const versions = await transactionalEntityManager.find(Version, {
          where: {
            course: {
              title: searchTerm ? ILike(`%${searchTerm.trim()}%`) : undefined,
            },
            assigned_admin: {
              email,
            },
          },
          relations: ['course', 'review_request', 'reviews', 'questions'],
        });

        return versions.map((version) => ({
          ...version,
          total_questions: version.questions.length,
          total_reviews: version.reviews.length,
        }));
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
    return this.adminRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const version = await transactionalEntityManager.findOne(Version, {
          where: {
            id: versionId,
            assigned_admin: {
              email,
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

  async getVersionReview({
    email,
    reviewId,
  }: {
    email: string;
    reviewId: string;
  }): Promise<Review> {
    return this.adminRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const review = await transactionalEntityManager.findOne(Review, {
          where: {
            id: reviewId,
            course_version: {
              assigned_admin: {
                email,
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

  async addCourseVersionReview({
    email,
    versionId,
    reviewInfo,
  }: {
    email: string;
    versionId: string;
    reviewInfo: ReviewInfoInput;
  }): Promise<ReviewTypeClass> {
    return await this.adminRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const admin = await transactionalEntityManager.findOne(Admin, {
          where: { email },
        });

        if (!admin) {
          throw new NotFoundException('Admin does not exist');
        }

        const courseVersion = await transactionalEntityManager.findOne(
          Version,
          {
            where: {
              id: versionId,
              assigned_admin: {
                email,
              },
            },
          },
        );

        if (!courseVersion) {
          throw new NotFoundException('Course version not found');
        }

        const review = new Review();
        review.title = reviewInfo.title;
        review.message = reviewInfo.message;
        review.course_version = courseVersion;

        return await transactionalEntityManager.save(Review, review);
      },
    );
  }

  async addReviewIssue({
    email,
    reviewId,
    issueInfo,
  }: {
    email: string;
    reviewId: string;
    issueInfo: IssueInfoInput;
  }): Promise<IssueTypeClass> {
    return await this.adminRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const admin = await transactionalEntityManager.findOne(Admin, {
          where: { email },
        });

        if (!admin) {
          throw new NotFoundException('Admin does not exist');
        }

        const review = await transactionalEntityManager.findOne(Review, {
          where: {
            id: reviewId,
            course_version: {
              assigned_admin: {
                email,
              },
            },
          },
        });

        if (!review) {
          throw new NotFoundException('Review not found');
        }

        const issue = new Issue();
        issue.description = issueInfo.description;
        issue.review = review;

        return await transactionalEntityManager.save(Issue, issue);
      },
    );
  }

  async closeIssue({
    email,
    issueId,
  }: {
    email: string;
    issueId: string;
  }): Promise<IssueTypeClass> {
    return await this.adminRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const admin = await transactionalEntityManager.findOne(Admin, {
          where: { email },
        });

        if (!admin) {
          throw new NotFoundException('Admin does not exist');
        }

        const issue = await transactionalEntityManager.findOne(Issue, {
          where: {
            id: issueId,
            review: {
              course_version: {
                assigned_admin: {
                  email,
                },
              },
            },
          },
        });

        if (!issue) {
          throw new NotFoundException('Issue not found');
        }

        issue.status = IssueStatusType.CLOSED;

        return await transactionalEntityManager.save(Issue, issue);
      },
    );
  }

  async closeReview({
    email,
    reviewId,
  }: {
    email: string;
    reviewId: string;
  }): Promise<ReviewTypeClass> {
    return await this.adminRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const admin = await transactionalEntityManager.findOne(Admin, {
          where: { email },
        });

        if (!admin) {
          throw new NotFoundException('Admin does not exist');
        }

        const review = await transactionalEntityManager.findOne(Review, {
          where: {
            id: reviewId,
            course_version: {
              assigned_admin: {
                email,
              },
            },
          },
        });

        if (!review) {
          throw new NotFoundException('Review not found');
        }

        review.status = ReviewStatusType.CLOSED;

        return await transactionalEntityManager.save(Review, review);
      },
    );
  }

  async approveCourseVersion({
    email,
    versionId,
  }: {
    email: string;
    versionId: string;
  }): Promise<VersionTypeClass> {
    return await this.adminRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const admin = await transactionalEntityManager.findOne(Admin, {
          where: { email },
        });

        if (!admin) {
          throw new NotFoundException('Admin does not exist');
        }

        const courseVersion = await transactionalEntityManager.findOne(
          Version,
          {
            where: {
              id: versionId,
              assigned_admin: {
                email,
              },
            },
            relations: ['course'],
          },
        );

        if (!courseVersion) {
          throw new NotFoundException('Course version not found');
        }

        courseVersion.course.approved_version = courseVersion;
        courseVersion.status = VersionStatusType.APPROVED;
        await transactionalEntityManager.save(Version, courseVersion);
        await transactionalEntityManager.save(Course, courseVersion.course);

        return courseVersion;
      },
    );
  }
}
