import { JwtService } from '@nestjs/jwt';
import { Admin as AdminTypeClass } from 'src/modules/auth/entities/admin.entity';
import { Instructor as InstructorTypeClass } from 'src/modules/auth/entities/instructor.entity';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { OrganizationLoginResponse } from '../types';
import { SignupProducer } from './signup.producer';
export declare class OrganizationService {
    private organizationRepository;
    private jwtService;
    private readonly signupProducer;
    constructor(organizationRepository: Repository<Organization>, jwtService: JwtService, signupProducer: SignupProducer);
    registerOrganization({ name, email, password, }: {
        name: string;
        email: string;
        password: string;
    }): Promise<{
        message: string;
    }>;
    registerAdmin({ organizationEmail, name, email, password, }: {
        organizationEmail: string;
        name: string;
        email: string;
        password: string;
    }): Promise<AdminTypeClass>;
    registerInstructor({ organizationEmail, name, email, password, }: {
        organizationEmail: string;
        name: string;
        email: string;
        password: string;
    }): Promise<InstructorTypeClass>;
    loginOrganization({ email, password, }: {
        email: string;
        password: string;
    }): Promise<OrganizationLoginResponse>;
}
