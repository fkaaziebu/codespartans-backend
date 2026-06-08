import { ConfigService } from '@nestjs/config';
import { Organization } from '../../auth/entities/organization.entity';
import { Student } from '../../auth/entities/student.entity';
import { Child } from '../../parent/entities/child.entity';
import { Parent } from '../../parent/entities/parent.entity';
import { ParentSubscription } from '../../parent/entities/parent-subscription.entity';
import { Repository } from 'typeorm';
import { OrgSubscription } from '../entities/organization-subscription.entity';
import { StudentSubscription } from '../entities/student-subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
export declare class PaymentService {
    private readonly planRepo;
    private readonly orgSubscriptionRepo;
    private readonly parentSubscriptionRepo;
    private readonly studentSubscriptionRepo;
    private readonly childRepo;
    private readonly orgRepo;
    private readonly parentRepo;
    private readonly studentRepo;
    private readonly configService;
    private readonly paystackBaseUrl;
    constructor(planRepo: Repository<SubscriptionPlan>, orgSubscriptionRepo: Repository<OrgSubscription>, parentSubscriptionRepo: Repository<ParentSubscription>, studentSubscriptionRepo: Repository<StudentSubscription>, childRepo: Repository<Child>, orgRepo: Repository<Organization>, parentRepo: Repository<Parent>, studentRepo: Repository<Student>, configService: ConfigService);
    listPlans(): Promise<SubscriptionPlan[]>;
    initiatePayment(email: string, planId: string, role: string, childrenIds?: string[]): Promise<{
        authorization_url: string;
        reference: string;
    }>;
    activateFreeTrial(email: string, plan: SubscriptionPlan, role: string, childrenIds: string[]): Promise<{
        authorization_url: string;
        reference: string;
    }>;
    verifyWebhookSignature(signature: string, rawBody: Buffer): void;
    handleWebhookEvent(event: string, data: any): Promise<void>;
    getParentSubscription(parentEmail: string): Promise<ParentSubscription | null>;
    listParentSubscriptions(parentEmail: string): Promise<ParentSubscription[]>;
    getStudentSubscription(studentEmail: string): Promise<StudentSubscription | null>;
    listStudentSubscriptions(studentEmail: string): Promise<StudentSubscription[]>;
}
