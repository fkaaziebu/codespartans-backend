import { Issue } from './issue.entity';
import { Version } from './version.entity';
export declare enum ReviewStatusType {
    OPEN = "OPEN",
    CLOSED = "CLOSED"
}
export declare class Review {
    id: string;
    title: string;
    message: string;
    status: ReviewStatusType;
    course_version: Version;
    issues: Issue[];
    inserted_at: Date;
    updated_at: Date;
}
