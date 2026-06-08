import { Cart as CartTypeClass } from 'src/modules/inventory/entities/cart.entity';
import { Category as CategoryTypeClass } from 'src/modules/inventory/entities/category.entity';
import { Checkout as CheckoutTypeClass } from 'src/modules/inventory/entities/checkout.entity';
import { Course as CourseTypeClass } from 'src/modules/inventory/entities/course.entity';
import { Student as StudentTypeClass } from 'src/modules/auth/entities/student.entity';
import { PaginationInput } from 'src/helpers/inputs';
import { SuiteType } from 'src/modules/review/entities/test_suite.entity';
import { AttemptFilterInput, CourseFilterInput } from '../inputs';
import { StudentService } from '../services';
import { StudentStatsResponse, SubjectProgressResponse, TestScoreHistoryResponse, TestTopicProgressResponse, WeakSubjectAreaResponse } from '../types';
export declare class StudentResolver {
    private readonly studentService;
    constructor(studentService: StudentService);
    getOrganizationCourse(context: any, courseId: string): Promise<CourseTypeClass>;
    listOrganizationCourses(context: any, organizationId?: string, searchTerm?: string, pagination?: PaginationInput, filter?: CourseFilterInput): Promise<{
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
    listOrganizationCategories(context: any, searchTerm?: string): Promise<CategoryTypeClass[]>;
    listCartCourses(context: any): Promise<CourseTypeClass[]>;
    listAttempts(context: any, searchTerm?: string, filter?: AttemptFilterInput, pagination?: PaginationInput): Promise<{
        edges: {
            cursor: string;
            node: {
                course_title: string;
                course_id: string;
                score: number;
                date_taken: Date;
                correct: number;
                wrong: number;
                time_taken: number;
                trend: number | null;
                id: string;
                status: import("src/modules/simulation/entities/test.entity").TestStatusType;
                mode: import("src/modules/simulation/entities/test.entity").TestModeType;
                test_suite: import("src/modules/review/entities/test_suite.entity").TestSuite;
                submitted_answers: import("../../simulation/entities/sumitted_answer.entity").SubmittedAnswer[];
                time_events: import("../../simulation/entities/time_event.entity").TimeEvent[];
                recommendations: import("../../simulation/entities/recommendation.entity").Recommendation[];
                course_category?: string;
                student: StudentTypeClass;
                assignment: import("../../simulation/entities/test_assignment.entity").TestAssignment;
            };
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    listCourseSuites(context: any, courseId: string, suiteTypes?: SuiteType[], pagination?: PaginationInput): Promise<{
        edges: {
            cursor: string;
            node: import("src/modules/review/entities/test_suite.entity").TestSuite;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    getActiveTest(context: any): Promise<{
        course_id: string;
        id: string;
        status: import("src/modules/simulation/entities/test.entity").TestStatusType;
        mode: import("src/modules/simulation/entities/test.entity").TestModeType;
        test_suite: import("src/modules/review/entities/test_suite.entity").TestSuite;
        submitted_answers: import("../../simulation/entities/sumitted_answer.entity").SubmittedAnswer[];
        time_events: import("../../simulation/entities/time_event.entity").TimeEvent[];
        recommendations: import("../../simulation/entities/recommendation.entity").Recommendation[];
        course_category?: string;
        student: StudentTypeClass;
        assignment: import("../../simulation/entities/test_assignment.entity").TestAssignment;
    }>;
    getTest(context: any, testId: string): Promise<{
        course_id: string;
        course_category: string;
        id: string;
        status: import("src/modules/simulation/entities/test.entity").TestStatusType;
        mode: import("src/modules/simulation/entities/test.entity").TestModeType;
        test_suite: import("src/modules/review/entities/test_suite.entity").TestSuite;
        submitted_answers: import("../../simulation/entities/sumitted_answer.entity").SubmittedAnswer[];
        time_events: import("../../simulation/entities/time_event.entity").TimeEvent[];
        recommendations: import("../../simulation/entities/recommendation.entity").Recommendation[];
        student: StudentTypeClass;
        assignment: import("../../simulation/entities/test_assignment.entity").TestAssignment;
    }>;
    getStudentStats(context: any): Promise<StudentStatsResponse>;
    getCurrentStreakCount(context: any): Promise<{
        current_streak: number;
        best_streak: number;
    }>;
    studentSubjectProgress(context: any, testId?: string): Promise<SubjectProgressResponse[]>;
    studentTestTopicProgress(context: any, testId: string): Promise<TestTopicProgressResponse[]>;
    weakSubjectAreas(context: any, testId?: string): Promise<WeakSubjectAreaResponse[]>;
    getTestScoreHistory(context: any, testId?: string): Promise<TestScoreHistoryResponse[]>;
    listCartCategories(context: any): Promise<CategoryTypeClass[]>;
    addCourseToCart(context: any, courseId: string): Promise<CartTypeClass>;
    completeSetup(context: any, categoryId: string, courseIds: string[]): Promise<StudentTypeClass>;
    removeCourseFromCart(context: any, courseId: string): Promise<CartTypeClass>;
    addCategoryToCart(context: any, categoryId: string): Promise<CartTypeClass>;
    changeStudentPassword(context: any, currentPassword: string, newPassword: string): Promise<StudentTypeClass>;
    createCheckout(context: any, autoApproveSubscription: boolean, checkoutFromCart: boolean, courseId: string): Promise<CheckoutTypeClass>;
}
