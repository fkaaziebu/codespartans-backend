import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { PaginationInput } from '../../../helpers/inputs';
import { SubjectProgressResponse } from '../../inventory/types/subject-progress-response.type';
import { WeakSubjectAreaResponse } from '../../inventory/types/weak-subject-area-response.type';
import { AttemptConnection } from '../../inventory/types';
import { TestAssignment } from '../../simulation/entities/test_assignment.entity';
import { TestSuite } from '../../review/entities/test_suite.entity';
import { Category } from '../../inventory/entities/category.entity';
import { Course } from '../../inventory/entities/course.entity';
import { EmailProducer } from '../../auth/services/email.producer';
import { SignupProducer } from '../../auth/services/signup.producer';
import { Child, ClassLevel } from '../entities/child.entity';
import { Gender, Parent } from '../entities/parent.entity';
import { ActivityConnection, ChildStatsResponse, LoginChildResponse, LoginParentResponse, SetupChildResult, StreakResponse, VerifyChildUsernameResponse } from '../types';
export declare class ParentService {
    private parentRepository;
    private childRepository;
    private categoryRepository;
    private testAssignmentRepository;
    private testSuiteRepository;
    private jwtService;
    private readonly configService;
    private readonly emailProducer;
    private readonly signupProducer;
    constructor(parentRepository: Repository<Parent>, childRepository: Repository<Child>, categoryRepository: Repository<Category>, testAssignmentRepository: Repository<TestAssignment>, testSuiteRepository: Repository<TestSuite>, jwtService: JwtService, configService: ConfigService, emailProducer: EmailProducer, signupProducer: SignupProducer);
    registerParent({ first_name, last_name, email, whatsapp_number, password, gender, }: {
        first_name: string;
        last_name: string;
        email: string;
        whatsapp_number: string;
        password: string;
        gender?: Gender;
    }): Promise<{
        message: string;
    }>;
    refreshParentToken(refresh_token: string): Promise<{
        access_token: string;
    }>;
    resendParentAccountValidationCode(email: string): Promise<{
        message: string;
    }>;
    verifyParentAccount({ email, code, }: {
        email: string;
        code: string;
    }): Promise<{
        message: string;
    }>;
    loginParent({ email, password, }: {
        email: string;
        password: string;
    }): Promise<LoginParentResponse>;
    requestParentPasswordReset({ email }: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    resetParentPassword({ email, password, token, }: {
        email: string;
        password: string;
        token: string;
    }): Promise<{
        message: string;
    }>;
    setupParentAccount(parentEmail: string, children: Array<{
        full_name: string;
        class_level: ClassLevel;
        target_exam: string;
        school_name?: string;
    }>): Promise<SetupChildResult[]>;
    addChild(parentEmail: string, { full_name, class_level, target_exam, school_name, }: {
        full_name: string;
        class_level: ClassLevel;
        target_exam: string;
        school_name?: string;
    }): Promise<{
        message: string;
        pin: string;
    }>;
    resetChildPin(parentEmail: string, childId: string): Promise<{
        message: string;
        pin: string;
    }>;
    shareChildLogin(parentEmail: string, childId: string): Promise<{
        message: string;
    }>;
    listOrganizationCategories(searchTerm?: string): Promise<Category[]>;
    listChildren(parentEmail: string, pagination?: PaginationInput): Promise<{
        edges: {
            cursor: string;
            node: Child;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    getChildStats(parentEmail: string, childId: string): Promise<ChildStatsResponse>;
    getChildSubjectProgress(parentEmail: string, childId: string, courseId?: string): Promise<SubjectProgressResponse[]>;
    getChildTestsHistory(parentEmail: string, childId: string, pagination?: PaginationInput): Promise<AttemptConnection>;
    getChildWeakAreas(parentEmail: string, childId: string): Promise<WeakSubjectAreaResponse[]>;
    getChildActivity(parentEmail: string, childId: string, pagination?: PaginationInput): Promise<ActivityConnection>;
    getChildStreak(parentEmail: string, childId: string): Promise<StreakResponse>;
    listChildStreak(parentEmail: string, childId: string, month: number, year: number): Promise<{
        date: string;
        is_active: boolean;
    }[]>;
    verifyChildUsername(username: string): Promise<VerifyChildUsernameResponse>;
    loginChild(temp_token: string, pin: string): Promise<LoginChildResponse>;
    assignTestToChild(parentEmail: string, childId: string, suiteId: string, note?: string): Promise<TestAssignment>;
    listChildCourses(parentEmail: string, childId: string): Promise<Course[]>;
    listChildAssignments(parentEmail: string, childId: string): Promise<TestAssignment[]>;
    listParentAlerts(parentEmail: string): Promise<{
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
    listChildMonthlyReports(parentEmail: string, childId: string): Promise<{
        month: number;
        year: number;
        avg_score: number;
        total_questions: number;
        streak_days: number;
    }[]>;
    private generateUniqueUsername;
    private computeStreaks;
}
