export declare enum SchoolDemoRole {
    PROPRIETOR_OWNER = "proprietor_owner",
    HEADMASTER_PRINCIPAL = "headmaster_principal",
    ACADEMIC_DIRECTOR = "academic_director",
    TEACHER = "teacher",
    OTHER = "other"
}
export declare enum ApproximateStudents {
    UNDER_50 = "under_50",
    BETWEEN_50_AND_100 = "50_to_100",
    BETWEEN_100_AND_300 = "100_to_300",
    BETWEEN_300_AND_500 = "300_to_500",
    ABOVE_500 = "above_500"
}
export declare enum DemoStatus {
    PENDING = "pending",
    ACTIVE = "active",
    EXPIRED = "expired",
    CONVERTED = "converted"
}
export declare class SchoolDemo {
    id: string;
    name: string;
    school_name: string;
    role: SchoolDemoRole;
    approximate_students: ApproximateStudents;
    email: string;
    whatsapp_number: string;
    demo_code: string;
    status: DemoStatus;
    activated_at: Date;
    expires_at: Date;
    trial_duration_days: number;
    created_at: Date;
    updated_at: Date;
}
