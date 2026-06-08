import { Issue as IssueTypeClass } from 'src/modules/review/entities/issue.entity';
import { Review as ReviewTypeClass } from 'src/modules/review/entities/review.entity';
import { Version as VersionTypeClass } from 'src/modules/review/entities/version.entity';
import { PaginationInput } from 'src/helpers/inputs';
import { IssueInfoInput, ReviewInfoInput } from '../inputs';
import { AdminService } from '../services';
export declare class AdminResolver {
    private readonly adminService;
    constructor(adminService: AdminService);
    listQuestionsForVersion(context: any, versionId: string, searchTerm?: string, pagination?: PaginationInput): Promise<{
        edges: {
            cursor: string;
            node: import("../entities/question.entity").Question;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    listAssignedVersions(context: any): Promise<{
        edges: {
            cursor: string;
            node: VersionTypeClass;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    getCourseVersion(context: any, versionId: string): Promise<VersionTypeClass>;
    getVersionReview(context: any, reviewId: string): Promise<ReviewTypeClass>;
    addCourseVersionReview(context: any, versionId: string, reviewInfo: ReviewInfoInput): Promise<ReviewTypeClass>;
    addReviewIssue(context: any, reviewId: string, issueInfo: IssueInfoInput): Promise<IssueTypeClass>;
    closeIssue(context: any, issueId: string): Promise<IssueTypeClass>;
    closeReview(context: any, reviewId: string): Promise<ReviewTypeClass>;
    approveCourseVersion(context: any, versionId: string): Promise<VersionTypeClass>;
}
