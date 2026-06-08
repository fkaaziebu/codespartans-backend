import { Version as VersionTypeClass } from 'src/modules/review/entities/version.entity';
import { ReviewResponse } from './review-response.type';
export declare class VersionResponse extends VersionTypeClass {
    reviews: ReviewResponse[];
    total_questions: number;
    total_reviews: number;
}
