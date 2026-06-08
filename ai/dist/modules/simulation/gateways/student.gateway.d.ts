import { Subject } from 'rxjs';
interface StudentSSEConnection {
    testId: string;
    studentId: string;
    subject: Subject<any>;
}
export declare class StudentGateway {
    private readonly logger;
    private activeConnections;
    private activeTestConnections;
    registerConnection(testId: string, studentId: string): Subject<any>;
    registerActiveTestConnection(studentId: string): Subject<any>;
    sendTimeUpdate(testId: string, studentId: string, remainingMs: number): void;
    sendTestEnded(testId: string, studentId: string): void;
    sendTestPaused(testId: string, studentId: string, remainingMs: number): void;
    sendTestResumed(testId: string, studentId: string, remainingMs: number): void;
    disconnectStudent(testId: string, studentId: string): void;
    getActiveConnections(): StudentSSEConnection[];
    clearAllConnections(): void;
}
export {};
