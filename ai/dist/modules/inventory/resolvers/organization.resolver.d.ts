import { Category as CategoryTypeClass } from 'src/modules/inventory/entities/category.entity';
import { Version as VersionTypeClass } from 'src/modules/review/entities/version.entity';
import { PaginationInput } from 'src/helpers/inputs';
import { CategoryInfoInput, RequestedReviewFilterInput } from '../inputs';
import { OrganizationService } from '../services';
import { StatsResponse } from '../types';
export declare class OrganizationResolver {
    private readonly organizationService;
    constructor(organizationService: OrganizationService);
    getStats(context: any): Promise<StatsResponse>;
    listInstructors(context: any, searchTerm?: string, pagination?: PaginationInput): Promise<{
        edges: {
            cursor: string;
            node: import("../../auth/entities/instructor.entity").Instructor;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    listAdmins(context: any, searchTerm?: string, pagination?: PaginationInput): Promise<{
        edges: {
            cursor: string;
            node: import("../../auth/entities/admin.entity").Admin;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    listRequestedReviews(context: any, filter?: RequestedReviewFilterInput, pagination?: PaginationInput): Promise<{
        edges: {
            cursor: string;
            node: import("../../review/entities/review_request.entity").ReviewRequest;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    listCoursesForOrganization(context: any, searchTerm?: string, pagination?: PaginationInput): Promise<{
        edges: {
            cursor: string;
            node: import("../entities/course.entity").Course;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    assignCourseVersionForReview(context: any, versionId: string, adminId: string): Promise<VersionTypeClass>;
    createCategory(context: any, categoryInfo: CategoryInfoInput): Promise<CategoryTypeClass>;
    addCoursesToCategory(context: any, categoryId: string, courseIds: string[]): Promise<CategoryTypeClass>;
}
