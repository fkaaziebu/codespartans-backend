import { Student as StudentTypeClass } from 'src/modules/auth/entities/student.entity';
export declare class StudentLoginResponse extends StudentTypeClass {
    token: string;
    refresh_token: string;
}
