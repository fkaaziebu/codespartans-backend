import { Test as TestTypeClass } from 'src/modules/simulation/entities/test.entity';
export declare class AttemptResponse extends TestTypeClass {
    course_title: string;
    course_id: string;
    score: number;
    date_taken: Date;
    correct: number;
    wrong: number;
    time_taken: number;
    trend?: number;
}
