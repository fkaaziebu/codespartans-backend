import { Queue } from 'bullmq';
export declare class MeilisearchProducer {
    private readonly meilisearchQueue;
    constructor(meilisearchQueue: Queue);
    updateMeilisearchDocuments(): Promise<void>;
}
