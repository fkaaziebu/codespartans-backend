import { Admin } from './admin.entity';
import { Category } from '../../inventory/entities/category.entity';
import { Coupon } from '../../inventory/entities/coupon.entity';
import { Course } from '../../inventory/entities/course.entity';
import { SchoolDemo } from '../../demo/entities/school-demo.entity';
import { Instructor } from './instructor.entity';
import { ReviewRequest } from '../../review/entities/review_request.entity';
import { Student } from './student.entity';
export declare class Organization {
    id: string;
    name: string;
    email: string;
    password: string;
    admins: Admin[];
    instructors: Instructor[];
    students: Student[];
    organizational_courses: Course[];
    organizational_categories: Category[];
    organizational_coupons: Coupon[];
    requested_reviews: ReviewRequest[];
    school_demo: SchoolDemo;
}
