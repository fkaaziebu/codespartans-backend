import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from './email.service';
export declare class EmailConsumer extends WorkerHost {
    private readonly emailService;
    constructor(emailService: EmailService);
    process(job: Job): Promise<void>;
}
