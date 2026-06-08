import { Instructor as InstructorTypeClass } from 'src/modules/auth/entities/instructor.entity';
export declare class InstructorResponse extends InstructorTypeClass {
    total_created_courses: number;
    total_requested_reviews: number;
    total_approved_courses: number;
}
