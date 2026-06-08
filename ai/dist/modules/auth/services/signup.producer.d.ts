import { Queue } from 'bullmq';
export declare class SignupProducer {
    private readonly signupQueue;
    constructor(signupQueue: Queue);
    enqueueFreeTrial(data: {
        email: string;
        role: string;
    }): Promise<void>;
}
