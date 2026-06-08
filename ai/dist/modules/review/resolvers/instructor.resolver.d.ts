import { Course as CourseTypeClass } from 'src/modules/inventory/entities/course.entity';
import { Issue as IssueTypeClass, IssueStatusType } from 'src/modules/review/entities/issue.entity';
import { Review as ReviewTypeClass } from 'src/modules/review/entities/review.entity';
import { PaginationInput } from 'src/helpers/inputs';
import { InstructorService } from '../services';
export declare class InstructorResolver {
    private readonly instructorService;
    constructor(instructorService: InstructorService);
    getInstructorVersionReview(context: any, reviewId: string): Promise<ReviewTypeClass>;
    listInstructorQuestionsForVersion(context: any, versionId: string, searchTerm?: string, pagination?: PaginationInput): Promise<{
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
    getCourse(context: any, courseId: string): Promise<CourseTypeClass>;
    getInstructorCourseVersion(context: any, versionId: string): Promise<import("../entities/version.entity").Version>;
    listCourses(context: any, searchTerm?: string, pagination?: PaginationInput): Promise<{
        edges: {
            cursor: string;
            node: CourseTypeClass;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    updateIssue(context: any, issueId: string, issueStatus: IssueStatusType, response: string): Promise<IssueTypeClass>;
}
