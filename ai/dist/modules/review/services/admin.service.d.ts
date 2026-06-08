import { PaginationInput } from '../../../helpers/inputs';
import { Repository } from 'typeorm';
import { Admin } from '../../auth/entities/admin.entity';
import { Question } from '../entities/question.entity';
import { Review } from '../entities/review.entity';
import { Version } from '../entities/version.entity';
import { Issue as IssueTypeClass } from '../entities/issue.entity';
import { Review as ReviewTypeClass } from '../entities/review.entity';
import { Version as VersionTypeClass } from '../entities/version.entity';
import { IssueInfoInput, ReviewInfoInput } from '../inputs';
import { MeilisearchProducer } from './meilisearch.producer';
export declare class AdminService {
    private adminRepository;
    private readonly meilisearchProducer;
    constructor(adminRepository: Repository<Admin>, meilisearchProducer: MeilisearchProducer);
    listQuestionsForVersionPaginated({ email, versionId, searchTerm, pagination, }: {
        email: string;
        versionId?: string;
        searchTerm?: string;
        pagination?: PaginationInput;
    }): Promise<{
        edges: {
            cursor: string;
            node: Question;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    listQuestionsForVersion({ email, versionId, searchTerm, }: {
        email: string;
        versionId: string;
        searchTerm?: string;
    }): Promise<Question[]>;
    listAssignedVersionsPaginated({ email, searchTerm, pagination, }: {
        email: string;
        searchTerm?: string;
        pagination?: PaginationInput;
    }): Promise<{
        edges: {
            cursor: string;
            node: Version;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    listAssignedVersions({ email, searchTerm, }: {
        email: string;
        searchTerm: string;
    }): Promise<Version[]>;
    getCourseVersion({ email, versionId, }: {
        email: string;
        versionId: string;
    }): Promise<Version>;
    getVersionReview({ email, reviewId, }: {
        email: string;
        reviewId: string;
    }): Promise<Review>;
    addCourseVersionReview({ email, versionId, reviewInfo, }: {
        email: string;
        versionId: string;
        reviewInfo: ReviewInfoInput;
    }): Promise<ReviewTypeClass>;
    addReviewIssue({ email, reviewId, issueInfo, }: {
        email: string;
        reviewId: string;
        issueInfo: IssueInfoInput;
    }): Promise<IssueTypeClass>;
    closeIssue({ email, issueId, }: {
        email: string;
        issueId: string;
    }): Promise<IssueTypeClass>;
    closeReview({ email, reviewId, }: {
        email: string;
        reviewId: string;
    }): Promise<ReviewTypeClass>;
    approveCourseVersion({ email, versionId, }: {
        email: string;
        versionId: string;
    }): Promise<VersionTypeClass>;
}
