import { Course } from './course.entity';
import { Organization } from '../../auth/entities/organization.entity';
export declare class Coupon {
    id: string;
    organization: Organization;
    courses: Course[];
}
