import { PaginationInput } from 'src/helpers/inputs';
import { AddSchoolStudentInput } from '../inputs/add-school-student.input';
import { BulkEnrollStudentsInput } from '../inputs/bulk-enroll-students.input';
import { LoginSchoolStudentInput } from '../inputs/login-school-student.input';
import { SchoolService } from '../services/school.service';
import { EnrollStudentResult, LoginSchoolStudentResponse } from '../types';
export declare class SchoolResolver {
    private readonly schoolService;
    constructor(schoolService: SchoolService);
    listSchoolStudents(context: any, searchTerm?: string, pagination?: PaginationInput): Promise<{
        edges: {
            cursor: string;
            node: import("../entities/school-student.entity").SchoolStudent;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    addSchoolStudent(input: AddSchoolStudentInput, context: any): Promise<{
        message: string;
        pin: string;
    }>;
    bulkEnrollStudents(input: BulkEnrollStudentsInput, context: any): Promise<EnrollStudentResult[]>;
    resetStudentPin(studentId: string, context: any): Promise<{
        message: string;
        pin: string;
    }>;
    shareStudentLogin(studentId: string, context: any): Promise<{
        message: string;
    }>;
    removeSchoolStudent(studentId: string, context: any): Promise<{
        message: string;
    }>;
    verifySchoolStudentUsername(username: string): Promise<{
        temp_token: string;
    }>;
    loginSchoolStudent(input: LoginSchoolStudentInput): Promise<LoginSchoolStudentResponse>;
}
