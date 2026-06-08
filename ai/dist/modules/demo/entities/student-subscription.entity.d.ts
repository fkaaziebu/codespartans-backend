import { SubscriptionPlan } from './subscription-plan.entity';
import { SubscriptionStatus } from './organization-subscription.entity';
import { Student } from '../../auth/entities/student.entity';
export declare class StudentSubscription {
    id: string;
    student: Student;
    plan: SubscriptionPlan;
    paystack_reference: string;
    status: SubscriptionStatus;
    started_at: Date;
    expires_at: Date;
    created_at: Date;
    updated_at: Date;
}
