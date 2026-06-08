import { Queue } from 'bullmq';
export declare class MarkAnswerProducer {
    private readonly markAnswerQueue;
    constructor(markAnswerQueue: Queue);
    markShortAnswer(data: {
        submittedAnswerId: string;
    }): Promise<void>;
}
