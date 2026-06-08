import { PaginationInput } from '../../../helpers/inputs';
import { Repository } from 'typeorm';
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
export declare class OrganizationService {
    private organizationRepository;
    private courseRepository;
    private categoryRepository;
    constructor(organizationRepository: Repository<Organization>, courseRepository: Repository<Course>, categoryRepository: Repository<Category>);
    listInstructorsPaginated({ email, searchTerm, pagination, }: {
        email: string;
        searchTerm?: string;
        pagination?: PaginationInput;
    }): Promise<{
        edges: {
            cursor: string;
            node: Instructor;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    listAdminsPaginated({ email, searchTerm, pagination, }: {
        email: string;
        searchTerm?: string;
        pagination?: PaginationInput;
    }): Promise<{
        edges: {
            cursor: string;
            node: Admin;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    listCoursesPaginated({ email, searchTerm, pagination, }: {
        email: string;
        searchTerm?: string;
        pagination?: PaginationInput;
    }): Promise<{
        edges: {
            cursor: string;
            node: Course;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    listCourses({ email, searchTerm, }: {
        email: string;
        searchTerm?: string;
    }): Promise<Course[]>;
    listRequestedReviewsPaginated({ email, filter, pagination, }: {
        email: string;
        filter?: RequestedReviewFilterInput;
        pagination?: PaginationInput;
    }): Promise<{
        edges: {
            cursor: string;
            node: ReviewRequest;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    listInstructors({ email, searchTerm, }: {
        email: string;
        searchTerm?: string;
    }): Promise<Instructor[]>;
    listAdmins({ email, searchTerm, }: {
        email: string;
        searchTerm?: string;
    }): Promise<Admin[]>;
    listRequestedReviews({ email, filter, }: {
        email: string;
        filter?: RequestedReviewFilterInput;
    }): Promise<ReviewRequest[]>;
    getStats({ email }: {
        email: string;
    }): Promise<StatsResponse>;
    assignCourseVersionForReview({ email, versionId, adminId, }: {
        email: string;
        versionId: string;
        adminId: string;
    }): Promise<Version>;
    createCategory({ email, categoryInfo, }: {
        email: string;
        categoryInfo: CategoryInfoInput;
    }): Promise<CategoryTypeClass>;
    addCoursesToCategory({ email, categoryId, courseIds, }: {
        email: string;
        categoryId: string;
        courseIds: string[];
    }): Promise<CategoryTypeClass>;
}
