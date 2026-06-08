import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private transporter;
    constructor(configService: ConfigService);
    private createTestAccount;
    private compileTemplate;
    sendParentPasswordResetEmail(to: string, name: string, resetToken: string): Promise<void>;
    sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<void>;
    sendAccountValidationEmail(to: string, name: string, validationCode: string): Promise<void>;
    sendDemoInvitationEmail(to: string, name: string, school_name: string): Promise<void>;
    sendDemoAdminNotificationEmail(name: string, school_name: string, role: string, approximate_students: string, email: string, whatsapp_number: string): Promise<void>;
    sendParentDemoInvitationEmail(to: string, full_name: string, target_exams: string[], registrationUrl: string): Promise<void>;
    sendStudentDemoInvitationEmail(to: string, full_name: string, target_exam: string, registrationUrl: string): Promise<void>;
    sendLeadAdminNotificationEmail(lead_type: string, full_name: string, email: string, target_exams_display: string, registrationUrl: string): Promise<void>;
    validateEmail(email: string): Promise<boolean>;
    private sendMail;
}
