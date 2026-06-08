import { Admin } from '../../auth/entities/admin.entity';
import { Course } from '../../inventory/entities/course.entity';
import { Question } from './question.entity';
import { Review } from './review.entity';
import { ReviewRequest } from './review_request.entity';
import { TestSuite } from './test_suite.entity';
export declare enum VersionStatusType {
    ARCHIVED = "ARCHIVED",
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare class Version {
    id: string;
    version_number: number;
    status: VersionStatusType;
    review_request: ReviewRequest;
    assigned_admin: Admin;
    course: Course;
    reviews: Review[];
    questions: Question[];
    test_suites: TestSuite[];
    inserted_at: Date;
    updated_at: Date;
}
