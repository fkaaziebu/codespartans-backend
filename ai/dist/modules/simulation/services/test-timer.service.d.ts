interface TestTimer {
    testId: string;
    studentId: string;
    endTime: Date;
    interval: NodeJS.Timeout;
}
export declare class TestTimerService {
    private readonly logger;
    private activeTimers;
    startTimer(testId: string, studentId: string, endTime: Date, onTick: (remainingMs: number) => void, onEnd: () => void): void;
    stopTimer(testId: string, studentId: string): void;
    getRemainingTime(endTime: Date): number;
    hasTestExpired(endTime: Date): boolean;
    pauseTimer(testId: string, studentId: string): number | null;
    resumeTimer(testId: string, studentId: string, endTime: Date, onTick: (remainingMs: number) => void, onEnd: () => void): void;
    getActiveTimers(): TestTimer[];
    clearAllTimers(): void;
}
export {};
