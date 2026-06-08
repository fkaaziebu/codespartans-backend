import { Organization } from './organization.entity';
import { Version } from '../../review/entities/version.entity';
export declare enum AdminStatusType {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE"
}
export declare class Admin {
    id: string;
    name: string;
    email: string;
    password: string;
    status: AdminStatusType;
    organization: Organization;
    assigned_course_versions_for_review: Version[];
}
