import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { PaymentService } from './payment.service';
export declare class SignupConsumer extends WorkerHost {
    private readonly planRepo;
    private readonly paymentService;
    private readonly logger;
    constructor(planRepo: Repository<SubscriptionPlan>, paymentService: PaymentService);
    process(job: Job): Promise<void>;
}
