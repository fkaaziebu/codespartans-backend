import { Test } from './test.entity';
export declare enum TimeEventType {
    STARTED = "STARTED",
    PAUSED = "PAUSED",
    RESUMED = "RESUMED",
    ENDED = "ENDED"
}
export declare class TimeEvent {
    id: string;
    type: TimeEventType;
    recorded_at: Date;
    test: Test;
}
