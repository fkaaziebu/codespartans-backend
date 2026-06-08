import { Question } from '../../review/entities/question.entity';
import { Test } from './test.entity';
export declare class SubmittedAnswer {
    id: string;
    question_id: string;
    answer_provided: string;
    hints_used: string[];
    is_flagged: boolean;
    is_correct: boolean | null;
    is_marked: boolean;
    time_ranges: string[];
    question: Question;
    test: Test;
}
