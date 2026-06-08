import { Question } from './question.entity';
import { Version } from './version.entity';
export declare enum SuiteDifficultyType {
    BEGINNER = "BEGINNER",
    INTERMEDIATE = "INTERMEDIATE",
    ADVANCED = "ADVANCED"
}
export declare enum SuiteType {
    YEAR = "YEAR",
    YEAR_ONE = "YEAR_ONE",
    YEAR_TWO = "YEAR_TWO",
    YEAR_THREE = "YEAR_THREE",
    MIXED = "MIXED",
    PAST_QUESTIONS = "PAST_QUESTIONS",
    CLASS = "CLASS",
    TOPIC = "TOPIC"
}
export declare class TestSuite {
    id: string;
    title: string;
    description: string;
    keywords: string[];
    difficulty: SuiteDifficultyType;
    suite_type: SuiteType;
    image_url: string;
    questions: Question[];
    course_version: Version;
}
