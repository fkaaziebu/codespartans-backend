import { Organization } from '../../auth/entities/organization.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
export declare enum SubscriptionStatus {
    ACTIVE = "active",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
export declare class OrgSubscription {
    id: string;
    organization: Organization;
    plan: SubscriptionPlan;
    paystack_reference: string;
    status: SubscriptionStatus;
    started_at: Date;
    expires_at: Date;
    created_at: Date;
    updated_at: Date;
}
