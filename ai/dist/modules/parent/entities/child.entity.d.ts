import { Student } from '../../auth/entities/student.entity';
import { Parent } from './parent.entity';
export declare enum ClassLevel {
    JHS1 = "JHS1",
    JHS2 = "JHS2",
    JHS3 = "JHS3",
    SHS1 = "SHS1",
    SHS2 = "SHS2",
    SHS3 = "SHS3"
}
export declare class Child {
    id: string;
    full_name: string;
    class_level: ClassLevel;
    target_exam: string;
    school_name: string;
    username: string;
    pin: string;
    parent: Parent;
    student: Student;
}
