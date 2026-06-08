import { Course } from '../../inventory/entities/course.entity';
import { Organization } from './organization.entity';
export declare enum InstructorStatusType {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE"
}
export declare class Instructor {
    id: string;
    name: string;
    email: string;
    password: string;
    status: InstructorStatusType;
    organizations: Organization[];
    created_courses: Course[];
}
