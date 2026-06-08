import { Question } from 'src/modules/review/entities/question.entity';
export declare class WeakSubjectAreaResponse {
    subject: string;
    error_count: number;
    total: number;
    accuracy: number;
    questions: Question[];
}
