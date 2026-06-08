import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { Student } from '../entities/student.entity';
import { PaginationInput } from '../../../helpers/inputs';
import { StudentLoginResponse } from '../types';
import { EmailProducer } from './email.producer';
import { SignupProducer } from './signup.producer';
import { LoginBodyDto } from '../dto/login-body.dto';
export declare class StudentService {
    private studentRepository;
    private jwtService;
    private configService;
    private readonly emailProducer;
    private readonly signupProducer;
    constructor(studentRepository: Repository<Student>, jwtService: JwtService, configService: ConfigService, emailProducer: EmailProducer, signupProducer: SignupProducer);
    listOrganizationsPaginated({ searchTerm, pagination, }: {
        searchTerm: string;
        pagination?: PaginationInput;
    }): Promise<{
        edges: {
            cursor: string;
            node: Organization;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    }>;
    listOrganizations({ searchTerm }: {
        searchTerm: string;
    }): Promise<Organization[]>;
    studentProfile({ email }: {
        email: string;
    }): Promise<Student>;
    registerStudent({ name, email, password, }: {
        name: string;
        email: string;
        password: string;
    }): Promise<{
        message: string;
    }>;
    loginStudent({ email, password, }: {
        email: string;
        password: string;
    }): Promise<StudentLoginResponse>;
    completeStudentAccountValidation({ email, validation_code, }: {
        email: string;
        validation_code: string;
    }): Promise<{
        message: string;
    }>;
    resendAccountValidationCode({ email, }: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    refreshStudentToken({ refresh_token, }: {
        refresh_token: string;
    }): Promise<{
        access_token: string;
    }>;
    requestStudentPasswordReset({ email }: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    resetStudentPassword({ email, password, token, }: {
        email: string;
        password: string;
        token: string;
    }): Promise<{
        message: string;
    }>;
    validateGoogleUser(googleUser: LoginBodyDto): Promise<Student>;
    createGoogleUser({ firstName, lastName, email }: {
        firstName: any;
        lastName: any;
        email: any;
    }): Promise<{
        id: string;
        organizationId: string;
        name: string;
        email: string;
        role: "STUDENT";
    }>;
}
