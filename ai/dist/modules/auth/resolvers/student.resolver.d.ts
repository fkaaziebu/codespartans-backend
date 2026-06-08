import { Student as StudentTypeClass } from 'src/modules/auth/entities/student.entity';
import { PaginationInput } from 'src/helpers/inputs';
import { StudentService } from '../services/student.service';
import { StudentLoginResponse } from '../types';
export declare class StudentResolver {
    private readonly studentService;
    constructor(studentService: StudentService);
    loginStudent(email: string, password: string): Promise<StudentLoginResponse>;
    studentProfile(context: any): Promise<StudentTypeClass>;
    listOrganizations(searchTerm?: string, pagination?: PaginationInput): Promise<{
        edges: {
            cursor: string;
            node: import("../entities/organization.entity").Organization;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    registerStudent(name: string, email: string, password: string): Promise<{
        message: string;
    }>;
    refreshStudentToken(refresh_token: string): Promise<{
        access_token: string;
    }>;
    completeStudentAccountValidation(email: string, validation_code: string): Promise<{
        message: string;
    }>;
    resendAccountValidationCode(email: string): Promise<{
        message: string;
    }>;
    requestStudentPasswordReset(email: string): Promise<{
        message: string;
    }>;
    resetStudentPassword(email: string, token: string, password: string): Promise<{
        message: string;
    }>;
}
