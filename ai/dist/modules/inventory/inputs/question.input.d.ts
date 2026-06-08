import { QuestionClassLevel, QuestionDifficultyType, QuestionTagType, QuestionType } from 'src/modules/review/entities/question.entity';
export declare class QuestionInput {
    question_number: number;
    description: string;
    hints: string[];
    solution_steps: string[];
    options?: string[];
    type: QuestionType;
    tags: QuestionTagType[];
    difficulty: QuestionDifficultyType;
    estimated_time_in_ms: number;
    class_level?: QuestionClassLevel;
    exam_year?: number;
    correct_answer: string;
    marks?: number;
}
