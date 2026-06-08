export declare enum PlanInterval {
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    YEARLY = "yearly"
}
export declare class SubscriptionPlan {
    id: string;
    plan_key: string;
    name: string;
    tagline: string;
    description: string;
    price: number;
    currency: string;
    interval: PlanInterval;
    duration_days: number;
    features: string[];
    billing_label: string;
    max_students: number;
    is_custom: boolean;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
