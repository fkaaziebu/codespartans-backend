declare const datas: {
    categoryName: string;
    courses: ({
        courseName: string;
        is_mandatory: boolean;
        imageFile: {
            filename: string;
            mime: string;
            ext: string;
        };
        suites: ({
            suiteName: string;
            suiteDescription: string;
            suiteKeywords: string[];
            questions: {
                question_number: number;
                description: string;
                hints: string[];
                solution_steps: string[];
                options: string[];
                type: string;
                tags: string[];
                difficulty: string;
                estimated_time_in_ms: number;
                class_level: string;
                exam_year: number;
                correct_answer: string;
            }[];
            suiteType?: undefined;
        } | {
            suiteName: string;
            suiteDescription: string;
            suiteKeywords: string[];
            suiteType: string;
            questions: {
                question_number: number;
                description: string;
                hints: string[];
                solution_steps: string[];
                options: string[];
                type: string;
                tags: string[];
                difficulty: string;
                estimated_time_in_ms: number;
                class_level: string;
                exam_year: number;
                correct_answer: string;
            }[];
        })[];
    } | {
        courseName: string;
        is_mandatory: boolean;
        imageFile: {
            filename: string;
            mime: string;
            ext: string;
        };
        suites: ({
            suiteName: string;
            suiteDescription: string;
            suiteKeywords: string[];
            questions: {
                question_number: number;
                description: string;
                hints: string[];
                solution_steps: string[];
                options: string[];
                type: string;
                tags: string[];
                difficulty: string;
                estimated_time_in_ms: number;
                class_level: string;
                exam_year: number;
                correct_answer: string;
            }[];
        } | {
            suiteName: string;
            suiteDescription: string;
            suiteKeywords: string[];
            questions: {
                question_number: number;
                description: string;
                hints: string[];
                solution_steps: string[];
                options: any[];
                type: string;
                tags: string[];
                difficulty: string;
                estimated_time_in_ms: number;
                class_level: string;
                exam_year: number;
                correct_answer: string;
                marks: number;
            }[];
        })[];
    })[];
}[];
export declare const plans: {
    plan_key: string;
    name: string;
    tagline: string;
    price: number;
    currency: string;
    interval: string;
    duration_days: number;
    is_custom: boolean;
    billing_label: string;
    max_students: number;
    features: string[];
}[];
export default datas;
