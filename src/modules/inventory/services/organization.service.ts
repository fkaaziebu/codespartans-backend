import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VersionStatusType } from '../../review/entities/version.entity';
import { PaginateHelper } from '../../../helpers';
import { PaginationInput } from '../../../helpers/inputs';
import { ILike, Repository } from 'typeorm';
import { Admin } from '../../auth/entities/admin.entity';
import { Instructor } from '../../auth/entities/instructor.entity';
import { Organization } from '../../auth/entities/organization.entity';
import { Category } from '../entities/category.entity';
import { Course } from '../entities/course.entity';
import { ReviewRequest } from '../../review/entities/review_request.entity';
import { Version } from '../../review/entities/version.entity';
import { Category as CategoryTypeClass } from 'src/modules/inventory/entities/category.entity';
import { CategoryInfoInput, RequestedReviewFilterInput } from '../inputs';
import { StatsResponse } from '../types';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async listInstructorsPaginated({
    id,
    searchTerm,
    pagination,
  }: {
    id: string;
    searchTerm?: string;
    pagination?: PaginationInput;
  }) {
    const instructors = await this.listInstructors({
      id,
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
    id,
    searchTerm,
    pagination,
  }: {
    id: string;
    searchTerm?: string;
    pagination?: PaginationInput;
  }) {
    const admins = await this.listAdmins({
      id,
      searchTerm,
    });

    // Apply pagination and return in the connection format
    return PaginateHelper.paginate<Admin>(admins, pagination, (admin) =>
      admin.id.toString(),
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
    const organization = await this.organizationRepository.findOne({
      where: {
        id,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const courses = await this.courseRepository.find({
      where: {
        organization: {
          id,
        },
        title: searchTerm ? ILike(`%${searchTerm.trim()}%`) : undefined,
      },
      relations: ['approved_version'],
    });

    return courses;
  }

  async listRequestedReviewsPaginated({
    id,
    filter,
    pagination,
  }: {
    id: string;
    filter?: RequestedReviewFilterInput;
    pagination?: PaginationInput;
  }) {
    const requested_reviews = await this.listRequestedReviews({
      id,
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
    id,
    searchTerm,
  }: {
    id: string;
    searchTerm?: string;
  }): Promise<Instructor[]> {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const instructors = await transactionalEntityManager.find(Instructor, {
          where: {
            name: searchTerm ? ILike(`%${searchTerm.trim()}%`) : undefined,
            organizations: { id },
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
    id,
    searchTerm,
  }: {
    id: string;
    searchTerm?: string;
  }): Promise<Admin[]> {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const admins = await transactionalEntityManager.find(Admin, {
          where: {
            name: searchTerm ? ILike(`%${searchTerm.trim()}%`) : undefined,
            organization: { id },
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
    id,
    filter,
  }: {
    id: string;
    filter?: RequestedReviewFilterInput;
  }): Promise<ReviewRequest[]> {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const organization = await transactionalEntityManager.findOne(
          Organization,
          {
            where: {
              id,
              requested_reviews: {
                course_version: {
                  status: filter?.status || undefined,
                  assigned_admin: {
                    id: filter?.adminId || undefined,
                  },
                  course: {
                    instructor: {
                      id: filter?.instructorId || undefined,
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

  async getStats({ id }: { id: string }): Promise<StatsResponse> {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const organization = await transactionalEntityManager.findOne(
          Organization,
          {
            where: { id },
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
    id,
    versionId,
    adminId,
  }: {
    id: string;
    versionId: string;
    adminId: string;
  }) {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const organization = await transactionalEntityManager.findOne(
          Organization,
          {
            where: { id },
          },
        );

        if (!organization) {
          throw new NotFoundException('Organization does not exist');
        }

        const admin = await transactionalEntityManager.findOne(Admin, {
          where: { id: adminId, organization: { id } },
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
                  id,
                },
              },
              course: {
                organization: {
                  id,
                },
              },
            },
          },
        );

        if (!courseVersion) {
          throw new NotFoundException('Course version not found');
        }

        courseVersion.assigned_admin = admin;
        courseVersion.status = VersionStatusType.IN_PROGRESS;
        return await transactionalEntityManager.save(Version, courseVersion);
      },
    );
  }

  async createCategory({
    id,
    categoryInfo,
  }: {
    id: string;
    categoryInfo: CategoryInfoInput;
  }): Promise<CategoryTypeClass> {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const organization = await transactionalEntityManager.findOne(
          Organization,
          {
            where: { id },
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
    id,
    categoryId,
    courseIds,
  }: {
    id: string;
    categoryId: string;
    courseIds: string[];
  }): Promise<CategoryTypeClass> {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const organization = await transactionalEntityManager.findOne(
          Organization,
          {
            where: { id },
          },
        );

        if (!organization) {
          throw new NotFoundException('Organization does not exist');
        }

        const category = await transactionalEntityManager.findOne(Category, {
          where: { id: categoryId, organization: { id } },
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

  async updateCategoryCountdown({
    id,
    categoryId,
    dateOfExams,
    examDurationDays,
  }: {
    id: string;
    categoryId: string;
    dateOfExams: Date;
    examDurationDays: number;
  }): Promise<boolean> {
    return await this.organizationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const category = await transactionalEntityManager.findOne(Category, {
          where: { id: categoryId, organization: { id } },
        });

        if (!category) {
          throw new NotFoundException(
            'Category does not exist or does not belong to this organization',
          );
        }

        category.date_of_exams = dateOfExams;
        category.exam_duration_days = examDurationDays;
        await transactionalEntityManager.save(Category, category);
        return true;
      },
    );
  }
}
