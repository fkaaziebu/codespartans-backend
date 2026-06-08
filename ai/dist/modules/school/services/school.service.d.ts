import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PaginationInput } from '../../../helpers/inputs';
import { Organization } from '../../auth/entities/organization.entity';
import { Student } from '../../auth/entities/student.entity';
import { Cart } from '../../inventory/entities/cart.entity';
import { Category } from '../../inventory/entities/category.entity';
import { Repository } from 'typeorm';
import { SchoolStudent } from '../entities/school-student.entity';
import { AddSchoolStudentInput } from '../inputs/add-school-student.input';
import { EnrollStudentResult, LoginSchoolStudentResponse } from '../types';
export declare class SchoolService {
    private readonly schoolStudentRepo;
    private readonly studentRepo;
    private readonly orgRepo;
    private readonly categoryRepo;
    private readonly cartRepo;
    private readonly jwtService;
    private readonly configService;
    constructor(schoolStudentRepo: Repository<SchoolStudent>, studentRepo: Repository<Student>, orgRepo: Repository<Organization>, categoryRepo: Repository<Category>, cartRepo: Repository<Cart>, jwtService: JwtService, configService: ConfigService);
    addSchoolStudent(orgEmail: string, input: AddSchoolStudentInput): Promise<{
        message: string;
        pin: string;
    }>;
    bulkEnrollStudents(orgEmail: string, students: AddSchoolStudentInput[]): Promise<EnrollStudentResult[]>;
    resetStudentPin(orgEmail: string, studentId: string): Promise<{
        message: string;
        pin: string;
    }>;
    shareStudentLogin(orgEmail: string, studentId: string): Promise<{
        message: string;
    }>;
    listSchoolStudents(orgEmail: string, searchTerm?: string, pagination?: PaginationInput): Promise<{
        edges: {
            cursor: string;
            node: SchoolStudent;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    removeSchoolStudent(orgEmail: string, studentId: string): Promise<{
        message: string;
    }>;
    verifyStudentUsername(username: string): Promise<{
        temp_token: string;
    }>;
    loginSchoolStudent(temp_token: string, pin: string): Promise<LoginSchoolStudentResponse>;
    private generateUniqueUsername;
}
