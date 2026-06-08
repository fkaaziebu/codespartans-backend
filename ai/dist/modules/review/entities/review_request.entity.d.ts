import { Organization } from '../../auth/entities/organization.entity';
import { Version } from './version.entity';
export declare class ReviewRequest {
    id: string;
    organization: Organization;
    course_version: Version;
    inserted_at: Date;
    updated_at: Date;
}
