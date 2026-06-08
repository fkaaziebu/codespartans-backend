import { Course as CourseTypeClass } from 'src/modules/inventory/entities/course.entity';
export declare class CourseResponse extends CourseTypeClass {
    is_subscribed: boolean;
    total_questions: number;
    estimated_duration: number;
}
