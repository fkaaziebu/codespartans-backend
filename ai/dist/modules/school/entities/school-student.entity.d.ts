import { Organization } from '../../auth/entities/organization.entity';
import { Student } from '../../auth/entities/student.entity';
import { ClassLevel } from '../../parent/entities/child.entity';
export declare class SchoolStudent {
    id: string;
    full_name: string;
    class_level: ClassLevel;
    target_exam: string;
    username: string;
    pin: string;
    organization: Organization;
    student: Student;
}
