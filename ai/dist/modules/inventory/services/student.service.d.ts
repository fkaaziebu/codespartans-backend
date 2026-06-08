import { Cart as CartTypeClass } from '../entities/cart.entity';
import { Checkout as CheckoutTypeClass } from '../entities/checkout.entity';
import { Student as StudentTypeClass } from '../../auth/entities/student.entity';
import { PaginationInput } from '../../../helpers/inputs';
import { Repository } from 'typeorm';
import { Organization } from '../../auth/entities/organization.entity';
import { Student } from '../../auth/entities/student.entity';
import { Category } from '../entities/category.entity';
import { Course } from '../entities/course.entity';
import { TestSuite, SuiteType } from '../../review/entities/test_suite.entity';
import { Test } from '../../simulation/entities/test.entity';
import { TestModeType, TestStatusType } from '../../simulation/entities/test.entity';
import { AttemptFilterInput, CourseFilterInput } from '../inputs';
import { StudentStatsResponse, SubjectProgressResponse, TestScoreHistoryResponse, TestTopicProgressResponse, WeakSubjectAreaResponse } from '../types';
export declare class StudentService {
    private studentRepository;
    private courseRepository;
    private organizationRepository;
    private categoryRepository;
    private testRepository;
    private testSuiteRepository;
    constructor(studentRepository: Repository<Student>, courseRepository: Repository<Course>, organizationRepository: Repository<Organization>, categoryRepository: Repository<Category>, testRepository: Repository<Test>, testSuiteRepository: Repository<TestSuite>);
    getOrganizationCourse({ email, courseId, }: {
        email: string;
        courseId: string;
    }): Promise<Course>;
    listOrganizationCoursesPaginated({ email, organizationId, searchTerm, pagination, filter, }: {
        email: string;
        organizationId?: string;
        searchTerm?: string;
        pagination?: PaginationInput;
        filter?: CourseFilterInput;
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
    listOrganizationCourses({ email, organizationId, searchTerm, filter, }: {
        email: string;
        organizationId?: string;
        searchTerm?: string;
        filter?: CourseFilterInput;
    }): Promise<Course[]>;
    listCartCourses({ email }: {
        email: string;
    }): Promise<Course[]>;
    listCartCategories({ email }: {
        email: string;
    }): Promise<Category[]>;
    listOrganizationCategories({ email, searchTerm, }: {
        email: string;
        searchTerm?: string;
    }): Promise<Category[]>;
    addCourseToCart({ email, courseId, }: {
        email: string;
        courseId: string;
    }): Promise<CartTypeClass>;
    removeCourseFromCart({ email, courseId, }: {
        email: string;
        courseId: string;
    }): Promise<CartTypeClass>;
    addCategoryToCart({ email, categoryId, }: {
        email: string;
        categoryId: string;
    }): Promise<CartTypeClass>;
    createCheckout({ email, courseId, checkoutFromCart, autoApproveSubscription, }: {
        email: string;
        courseId?: string;
        checkoutFromCart?: boolean;
        autoApproveSubscription: boolean;
    }): Promise<CheckoutTypeClass>;
    completeSetup({ email, categoryId, courseIds, }: {
        email: string;
        categoryId: string;
        courseIds: string[];
    }): Promise<StudentTypeClass>;
    listAttempts({ email, searchTerm, filter, pagination, }: {
        email: string;
        searchTerm?: string;
        filter?: AttemptFilterInput;
        pagination?: PaginationInput;
    }): Promise<{
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
                status: TestStatusType;
                mode: TestModeType;
                test_suite: TestSuite;
                submitted_answers: import("../../simulation/entities/sumitted_answer.entity").SubmittedAnswer[];
                time_events: import("../../simulation/entities/time_event.entity").TimeEvent[];
                recommendations: import("../../simulation/entities/recommendation.entity").Recommendation[];
                course_category?: string;
                student: Student;
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
    getActiveTest({ email }: {
        email: string;
    }): Promise<{
        course_id: string;
        id: string;
        status: TestStatusType;
        mode: TestModeType;
        test_suite: TestSuite;
        submitted_answers: import("../../simulation/entities/sumitted_answer.entity").SubmittedAnswer[];
        time_events: import("../../simulation/entities/time_event.entity").TimeEvent[];
        recommendations: import("../../simulation/entities/recommendation.entity").Recommendation[];
        course_category?: string;
        student: Student;
        assignment: import("../../simulation/entities/test_assignment.entity").TestAssignment;
    }>;
    getTest({ email, testId }: {
        email: string;
        testId: string;
    }): Promise<{
        course_id: string;
        course_category: string;
        id: string;
        status: TestStatusType;
        mode: TestModeType;
        test_suite: TestSuite;
        submitted_answers: import("../../simulation/entities/sumitted_answer.entity").SubmittedAnswer[];
        time_events: import("../../simulation/entities/time_event.entity").TimeEvent[];
        recommendations: import("../../simulation/entities/recommendation.entity").Recommendation[];
        student: Student;
        assignment: import("../../simulation/entities/test_assignment.entity").TestAssignment;
    }>;
    getStats({ email }: {
        email: string;
    }): Promise<StudentStatsResponse>;
    studentSubjectProgress({ email, testId, }: {
        email: string;
        testId?: string;
    }): Promise<SubjectProgressResponse[]>;
    studentTestTopicProgress({ email, testId, }: {
        email: string;
        testId: string;
    }): Promise<TestTopicProgressResponse[]>;
    weakSubjectAreas({ email, testId, }: {
        email: string;
        testId?: string;
    }): Promise<WeakSubjectAreaResponse[]>;
    getTestScoreHistory({ email, testId, }: {
        email: string;
        testId?: string;
    }): Promise<TestScoreHistoryResponse[]>;
    changeStudentPassword({ email, currentPassword, newPassword, }: {
        email: string;
        currentPassword: string;
        newPassword: string;
    }): Promise<StudentTypeClass>;
    listCourseSuitesPaginated({ email, courseId, suiteTypes, pagination, }: {
        email: string;
        courseId: string;
        suiteTypes?: SuiteType[];
        pagination?: PaginationInput;
    }): Promise<{
        edges: {
            cursor: string;
            node: TestSuite;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    getCurrentStreakCount({ email, }: {
        email: string;
    }): Promise<{
        current_streak: number;
        best_streak: number;
    }>;
    private computeStreaks;
}
