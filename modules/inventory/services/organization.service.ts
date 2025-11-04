import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VersionStatusType } from 'src/database/types/version.type';
import { PaginateHelper } from 'src/helpers';
import { PaginationInput } from 'src/helpers/inputs';
import { ILike, Repository } from 'typeorm';
import {
  Admin,
  Category,
  Course,
  Instructor,
  Organization,
  ReviewRequest,
  Version,
} from '../../../database/entities';
import { CategoryTypeClass, VersionTypeClass } from '../../../database/types';
import { CategoryInfoInput, RequestedReviewFilterInput } from '../inputs';
import { StatsResponse } from '../types';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async listInstructorsPaginated({
    email,
    searchTerm,
    pagination,
  }: {
    email: string;
    searchTerm?: string;
    pagination?: PaginationInput;
  }) {
    const instructors = await this.listInstructors({
      email,
      searchTerm,
    });

    // Apply pagination and return in the connection format
    return PaginateHelper.paginate<Instructor>(
      instructors,
      pagination,
      (instructor) => instructor.id.toString(),
    );
  }

  async listAdminsPaginated({
    email,
    searchTerm,
    pagination,
  }: {
    email: string;
    searchTerm?: string;
    pagination?: PaginationInput;
  }) {
    const admins = await this.listAdmins({
      email,
      searchTerm,
    });

    // Apply pagination and return in the connection format
    return PaginateHelper.paginate<Admin>(admins, pagination, (admin) =>
      admin.id.toString(),
    );
  }

  async listRequestedReviewsPaginated({
    email,
    filter,
    pagination,
  }: {
    email: string;
    filter?: RequestedReviewFilterInput;
    pagination?: PaginationInput;
  }) {
    const requested_reviews = await this.listRequestedReviews({
      email,
      filter,
    });

    // Apply pagination and return in the connection format
    return PaginateHelper.paginate<ReviewRequest>(
      requested_reviews,
      pagination,
      (requested_review) => requested_review.id.toString(),
    );
  }

  async listInstructors({
    email,
    searchTerm,
  }: {
    email: string;
    searchTerm?: string;
  }): Promise<Instructor[]> {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const instructors = await transactionalEntityManager.find(Instructor, {
          where: {
            name: searchTerm ? ILike(`%${searchTerm.trim()}%`) : undefined,
            organizations: { email },
          },
          relations: [
            'created_courses.approved_version',
            'created_courses.versions.reviews',
            'created_courses.versions.review_request',
          ],
        });

        return instructors.map((instructor) => ({
          ...instructor,
          total_created_courses: instructor.created_courses.length,
          total_requested_reviews: instructor.created_courses?.reduce(
            (acc, course) =>
              acc +
              (course.versions?.reduce(
                (acc, version) => acc + (version?.review_request ? 1 : 0),
                0,
              ) || 0),
            0,
          ),
          total_approved_courses: instructor.created_courses?.reduce(
            (acc, course) => acc + (course?.approved_version ? 1 : 0),

            0,
          ),
        }));
      },
    );
  }

  async listAdmins({
    email,
    searchTerm,
  }: {
    email: string;
    searchTerm?: string;
  }): Promise<Admin[]> {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const admins = await transactionalEntityManager.find(Admin, {
          where: {
            name: searchTerm ? ILike(`%${searchTerm.trim()}%`) : undefined,
            organization: { email },
          },
          relations: ['assigned_course_versions_for_review.course.instructor'],
        });

        return admins.map((admin) => ({
          ...admin,
          total_course_versions:
            admin.assigned_course_versions_for_review?.length,
          total_approved_course_versions:
            admin.assigned_course_versions_for_review?.reduce(
              (acc, version) =>
                acc + (version?.status === VersionStatusType.APPROVED ? 1 : 0),
              0,
            ),
        }));
      },
    );
  }

  async listRequestedReviews({
    email,
    filter,
  }: {
    email: string;
    filter?: RequestedReviewFilterInput;
  }): Promise<ReviewRequest[]> {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const organization = await transactionalEntityManager.findOne(
          Organization,
          {
            where: {
              email,
              requested_reviews: {
                course_version: {
                  assigned_admin: {
                    id: filter.adminId,
                  },
                  course: {
                    instructor: {
                      id: filter.instructorId,
                    },
                  },
                },
              },
            },
            relations: [
              'requested_reviews.course_version.assigned_admin',
              'requested_reviews.course_version.course.instructor',
              'requested_reviews.course_version.course.approved_version',
            ],
          },
        );

        if (!organization) {
          throw new NotFoundException('Organization not found');
        }

        return organization.requested_reviews;
      },
    );
  }

  async getStats({ email }: { email: string }): Promise<StatsResponse> {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const organization = await transactionalEntityManager.findOne(
          Organization,
          {
            where: { email },
            relations: [
              'admins.assigned_course_versions_for_review',
              'instructors',
              'requested_reviews.course_version',
              'organizational_courses.approved_version',
            ],
          },
        );

        if (!organization) {
          throw new NotFoundException('Organization does not exist');
        }

        return {
          total_admins: organization.admins.length,
          total_instructors: organization.instructors.length,
          total_requested_reviews: organization.requested_reviews.length,
          total_assigned_reviews: organization.admins.reduce(
            (acc, admin) =>
              acc + admin.assigned_course_versions_for_review.length,
            0,
          ),
          total_completed_reviews: organization.requested_reviews.reduce(
            (acc, review_req) =>
              acc +
              (review_req.course_version.status === VersionStatusType.APPROVED
                ? 1
                : 0),
            0,
          ),
        };
      },
    );
  }

  async assignCourseVersionForReview({
    email,
    versionId,
    adminId,
  }: {
    email: string;
    versionId: string;
    adminId: string;
  }): Promise<VersionTypeClass> {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const organization = await transactionalEntityManager.findOne(
          Organization,
          {
            where: { email },
          },
        );

        if (!organization) {
          throw new NotFoundException('Organization does not exist');
        }

        const admin = await transactionalEntityManager.findOne(Admin, {
          where: { id: adminId, organization: { email } },
        });

        if (!admin) {
          throw new Error('Admin does not exist');
        }

        const courseVersion = await transactionalEntityManager.findOne(
          Version,
          {
            where: {
              id: versionId,
              review_request: {
                organization: {
                  email,
                },
              },
              course: {
                organization: {
                  email,
                },
              },
            },
          },
        );

        if (!courseVersion) {
          throw new NotFoundException('Course version not found');
        }

        courseVersion.assigned_admin = admin;
        return await transactionalEntityManager.save(Version, courseVersion);
      },
    );
  }

  async createCategory({
    email,
    categoryInfo,
  }: {
    email: string;
    categoryInfo: CategoryInfoInput;
  }): Promise<CategoryTypeClass> {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const organization = await transactionalEntityManager.findOne(
          Organization,
          {
            where: { email },
          },
        );

        if (!organization) {
          throw new NotFoundException('Organization does not exist');
        }

        const category = new Category();
        category.avatar_url = categoryInfo.avatar_url;
        category.name = categoryInfo.name;
        category.organization = organization;
        return await transactionalEntityManager.save(Category, category);
      },
    );
  }

  async addCoursesToCategory({
    email,
    categoryId,
    courseIds,
  }: {
    email: string;
    categoryId: string;
    courseIds: string[];
  }): Promise<CategoryTypeClass> {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const organization = await transactionalEntityManager.findOne(
          Organization,
          {
            where: { email },
          },
        );

        if (!organization) {
          throw new NotFoundException('Organization does not exist');
        }

        const category = await transactionalEntityManager.findOne(Category, {
          where: { id: categoryId, organization: { email } },
        });

        if (!category) {
          throw new NotFoundException('Category does not exist');
        }

        const courses = await transactionalEntityManager.findByIds(
          Course,
          courseIds,
        );

        if (!courses.length) {
          throw new NotFoundException('Courses do not exist');
        }

        category.courses = courses;
        return await transactionalEntityManager.save(Category, category);
      },
    );
  }
}
