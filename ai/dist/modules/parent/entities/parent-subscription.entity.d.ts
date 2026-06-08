import { SubscriptionPlan } from '../../demo/entities/subscription-plan.entity';
import { SubscriptionStatus } from '../../demo/entities/organization-subscription.entity';
import { Parent } from './parent.entity';
import { Child } from './child.entity';
export declare class ParentSubscription {
    id: string;
    parent: Parent;
    plan: SubscriptionPlan;
    paystack_reference: string;
    status: SubscriptionStatus;
    started_at: Date;
    expires_at: Date;
    children: Child[];
    created_at: Date;
    updated_at: Date;
}
