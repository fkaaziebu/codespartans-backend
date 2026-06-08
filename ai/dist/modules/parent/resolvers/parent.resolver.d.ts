import { Course } from 'src/modules/inventory/entities/course.entity';
import { TestAssignment } from 'src/modules/simulation/entities/test_assignment.entity';
import { PaginationInput } from 'src/helpers/inputs';
import { Category } from 'src/modules/inventory/entities/category.entity';
import { AttemptConnection } from 'src/modules/inventory/types';
import { SubjectProgressResponse } from 'src/modules/inventory/types/subject-progress-response.type';
import { WeakSubjectAreaResponse } from 'src/modules/inventory/types/weak-subject-area-response.type';
import { AddChildInput } from '../inputs/add-child.input';
import { LoginChildInput } from '../inputs/login-child.input';
import { LoginParentInput } from '../inputs/login-parent.input';
import { RegisterParentInput } from '../inputs/register-parent.input';
import { SetupParentAccountInput } from '../inputs/setup-parent-account.input';
import { VerifyChildUsernameInput } from '../inputs/verify-child-username.input';
import { VerifyParentInput } from '../inputs/verify-parent.input';
import { ParentService } from '../services/parent.service';
import { ActivityConnection, ChildStatsResponse, LoginChildResponse, LoginParentResponse, SetupChildResult, StreakResponse, VerifyChildUsernameResponse } from '../types';
export declare class ParentResolver {
    private readonly parentService;
    constructor(parentService: ParentService);
    registerParent(input: RegisterParentInput): Promise<{
        message: string;
    }>;
    verifyParentAccount(input: VerifyParentInput): Promise<{
        message: string;
    }>;
    resendParentAccountValidationCode(email: string): Promise<{
        message: string;
    }>;
    loginParent(input: LoginParentInput): Promise<LoginParentResponse>;
    refreshParentToken(refresh_token: string): Promise<{
        access_token: string;
    }>;
    requestParentPasswordReset(email: string): Promise<{
        message: string;
    }>;
    resetParentPassword(email: string, token: string, password: string): Promise<{
        message: string;
    }>;
    setupParentAccount(input: SetupParentAccountInput, context: any): Promise<SetupChildResult[]>;
    addChild(input: AddChildInput, context: any): Promise<{
        message: string;
        pin: string;
    }>;
    resetChildPin(childId: string, context: any): Promise<{
        message: string;
        pin: string;
    }>;
    shareChildLogin(childId: string, context: any): Promise<{
        message: string;
    }>;
    listParentOrganizationCategories(searchTerm?: string): Promise<Category[]>;
    listChildren(context: any, pagination?: PaginationInput): Promise<{
        edges: {
            cursor: string;
            node: import("../entities/child.entity").Child;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    getChildStats(childId: string, context: any): Promise<ChildStatsResponse>;
    getChildSubjectProgress(childId: string, context: any, courseId?: string): Promise<SubjectProgressResponse[]>;
    getChildTestsHistory(childId: string, context: any, pagination?: PaginationInput): Promise<AttemptConnection>;
    getChildWeakAreas(childId: string, context: any): Promise<WeakSubjectAreaResponse[]>;
    getChildActivity(childId: string, context: any, pagination?: PaginationInput): Promise<ActivityConnection>;
    getChildStreak(childId: string, context: any): Promise<StreakResponse>;
    listChildStreak(childId: string, month: number, year: number, context: any): Promise<{
        date: string;
        is_active: boolean;
    }[]>;
    verifyChildUsername(input: VerifyChildUsernameInput): Promise<VerifyChildUsernameResponse>;
    loginChild(input: LoginChildInput): Promise<LoginChildResponse>;
    assignTestToChild(childId: string, suiteId: string, context: any, note?: string): Promise<TestAssignment>;
    listParentAlerts(context: any): Promise<{
        id: string;
        alert_type: string;
        icon: string;
        icon_bg: string;
        title: string;
        description: string;
        time_label: string;
        is_unread: boolean;
        actions: {
            label: string;
            variant: string;
            href: string;
        }[];
    }[]>;
    listChildMonthlyReports(childId: string, context: any): Promise<{
        month: number;
        year: number;
        avg_score: number;
        total_questions: number;
        streak_days: number;
    }[]>;
    listChildCourses(childId: string, context: any): Promise<Course[]>;
    listChildAssignments(childId: string, context: any): Promise<TestAssignment[]>;
}
