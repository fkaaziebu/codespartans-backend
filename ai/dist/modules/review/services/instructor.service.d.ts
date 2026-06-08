import { PaginationInput } from '../../../helpers/inputs';
import { Repository } from 'typeorm';
import { Instructor } from '../../auth/entities/instructor.entity';
import { Course } from '../../inventory/entities/course.entity';
import { Question } from '../entities/question.entity';
import { Review } from '../entities/review.entity';
import { Version } from '../entities/version.entity';
import { Issue as IssueTypeClass, IssueStatusType } from '../entities/issue.entity';
export declare class InstructorService {
    private instructorRepository;
    constructor(instructorRepository: Repository<Instructor>);
    getVersionReview({ email, reviewId, }: {
        email: string;
        reviewId: string;
    }): Promise<Review>;
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
    getCourseVersion({ email, versionId, }: {
        email: string;
        versionId: string;
    }): Promise<Version>;
    getCourse({ email, courseId, }: {
        email: string;
        courseId: string;
    }): Promise<Course>;
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
    updateIssueStatus({ email, issueId, issueStatus, response, }: {
        email: string;
        issueId: string;
        issueStatus: IssueStatusType;
        response: string;
    }): Promise<IssueTypeClass>;
}
