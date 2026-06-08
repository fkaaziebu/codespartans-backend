import { SchoolStudent } from '../entities/school-student.entity';
export declare class LoginSchoolStudentResponse extends SchoolStudent {
    token: string;
    refresh_token: string;
}
