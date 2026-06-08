import { DemoStatus } from './school-demo.entity';
export declare class StudentDemoRequest {
    id: string;
    full_name: string;
    email: string;
    demo_code: string;
    target_exam: string;
    status: DemoStatus;
    activated_at: Date;
    expires_at: Date;
    trial_duration_days: number;
    created_at: Date;
    updated_at: Date;
}
