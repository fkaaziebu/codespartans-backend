import { Review } from './review.entity';
export declare enum IssueStatusType {
    OPEN = "OPEN",
    IN_PROGRESS = "IN_PROGRESS",
    RESOLVED = "RESOLVED",
    CLOSED = "CLOSED"
}
export declare class Issue {
    id: string;
    description: string;
    status: IssueStatusType;
    response: string;
    review: Review;
}
