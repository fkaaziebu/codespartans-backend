import { Category } from './category.entity';
import { Coupon } from './coupon.entity';
import { Instructor } from '../../auth/entities/instructor.entity';
import { Organization } from '../../auth/entities/organization.entity';
import { Student } from '../../auth/entities/student.entity';
import { Version } from '../../review/entities/version.entity';
export declare enum DomainType {
    SCIENCE = "SCIENCE",
    ENGLISH = "ENGLISH",
    MATHEMATICS = "MATHEMATICS"
}
export declare enum LevelType {
    BEGINNER = "BEGINNER",
    INTERMEDIATE = "INTERMEDIATE",
    ADVANCED = "ADVANCED"
}
export declare enum CurrencyType {
    USD = "USD",
    EUR = "EUR"
}
export declare class Course {
    id: string;
    title: string;
    avatar_url: string;
    description: string;
    is_mandatory: boolean;
    domains: DomainType[];
    level: LevelType;
    price: number;
    currency: CurrencyType;
    versions: Version[];
    approved_version: Version;
    coupons: Coupon[];
    categories: Category[];
    subscribed_students: Student[];
    organization: Organization;
    instructor: Instructor;
    inserted_at: Date;
    updated_at: Date;
}
