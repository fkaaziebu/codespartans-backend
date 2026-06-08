import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MarkAnswerService } from './mark-answer.service';
export declare class MarkAnswerConsumer extends WorkerHost {
    private readonly markAnswerService;
    constructor(markAnswerService: MarkAnswerService);
    process(job: Job): Promise<void>;
}
