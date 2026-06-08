import { ConfigService } from '@nestjs/config';
import { VerifyCallback } from 'passport-google-oauth20';
import { StudentService } from '../../modules/auth/services/student.service';
declare const GoogleStrategy_base: new (...args: any) => any;
export declare class GoogleStrategy extends GoogleStrategy_base {
    private configService;
    private studentService;
    constructor(configService: ConfigService, studentService: StudentService);
    validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any>;
}
export {};
