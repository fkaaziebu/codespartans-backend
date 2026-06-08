import { Category } from './category.entity';
import { Course } from './course.entity';
import { Student } from '../../auth/entities/student.entity';
export declare class Checkout {
    id: string;
    student: Student;
    courses: Course[];
    categories: Category[];
}
