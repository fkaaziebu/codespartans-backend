import { Course } from './course.entity';
import { Organization } from '../../auth/entities/organization.entity';
import { Student } from '../../auth/entities/student.entity';
export declare class Category {
    id: string;
    name: string;
    avatar_url: string;
    organization: Organization;
    subscribed_students: Student[];
    courses: Course[];
}
