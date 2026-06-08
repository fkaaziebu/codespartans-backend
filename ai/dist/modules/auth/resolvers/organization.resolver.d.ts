import { Admin as AdminTypeClass } from 'src/modules/auth/entities/admin.entity';
import { Instructor as InstructorTypeClass } from 'src/modules/auth/entities/instructor.entity';
import { OrganizationService } from '../services';
import { OrganizationLoginResponse } from '../types';
export declare class OrganizationResolver {
    private readonly organizationService;
    constructor(organizationService: OrganizationService);
    loginOrganization(email: string, password: string): Promise<OrganizationLoginResponse>;
    registerOrganization(name: string, email: string, password: string): Promise<{
        message: string;
    }>;
    registerInstructor(context: any, name: string, email: string, password: string): Promise<InstructorTypeClass>;
    registerAdmin(context: any, name: string, email: string, password: string): Promise<AdminTypeClass>;
}
