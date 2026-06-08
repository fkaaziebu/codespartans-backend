import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MeilisearchService } from './meilisearch.service';
export declare class MeilisearchConsumer extends WorkerHost {
    private readonly meilisearchService;
    constructor(meilisearchService: MeilisearchService);
    process(job: Job): Promise<void>;
}
