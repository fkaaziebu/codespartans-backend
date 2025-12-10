import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';

interface StudentSSEConnection {
  testId: string;
  studentId: string;
  subject: Subject<any>;
}

interface StudentTestSSEConnection {
  studentId: string;
  subject: Subject<any>;
}

@Injectable()
export class StudentGateway {
  private readonly logger = new Logger(StudentGateway.name);
  private activeConnections = new Map<string, StudentSSEConnection>();
  private activeTestConnections = new Map<string, StudentTestSSEConnection>();

  /**
   * Register a student's SSE connection
   * Returns a subject that can be used to send events to the student
   */
  registerConnection(testId: string, studentId: string): Subject<any> {
    const connectionId = `${testId}-${studentId}`;

    // Clean up any existing connection
    const existingConnection = this.activeConnections.get(connectionId);
    if (existingConnection) {
      existingConnection.subject.complete();
    }

    const subject = new Subject<any>();
    this.activeConnections.set(connectionId, {
      testId,
      studentId,
      subject,
    });

    this.logger.log(
      `SSE connection registered for test ${testId}, student ${studentId}`,
    );

    // Clean up when subject completes
    subject.subscribe({
      complete: () => {
        this.logger.log(
          `SSE connection completed for test ${testId}, student ${studentId}`,
        );
        this.activeConnections.delete(connectionId);
      },
    });

    return subject;
  }

  registerActiveTestConnection(studentId: string): Subject<any> {
    const connectionId = `${studentId}`;

    // Clean up any existing connection
    const existingConnection = this.activeTestConnections.get(connectionId);
    if (existingConnection) {
      existingConnection.subject.complete();
    }

    const subject = new Subject<any>();
    this.activeTestConnections.set(connectionId, {
      studentId,
      subject,
    });

    this.logger.log(`SSE connection registered for student ${studentId}`);

    // Clean up when subject completes
    subject.subscribe({
      complete: () => {
        this.logger.log(`SSE connection completed for student ${studentId}`);
        this.activeTestConnections.delete(connectionId);
      },
    });

    return subject;
  }

  /**
   * Send a time update event to a student
   */
  sendTimeUpdate(testId: string, studentId: string, remainingMs: number): void {
    const connectionId = `${testId}-${studentId}`;
    const connection = this.activeConnections.get(connectionId);

    if (connection) {
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      connection.subject.next({
        type: 'time_update',
        remainingSeconds,
        remainingMs,
        timestamp: new Date(),
      });
    }

    const testConnection = this.activeTestConnections.get(studentId);
    if (testConnection) {
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      testConnection.subject.next({
        type: 'time_update',
        testId,
        remainingSeconds,
        remainingMs,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Send a test ended event to a student
   */
  sendTestEnded(testId: string, studentId: string): void {
    const connectionId = `${testId}-${studentId}`;
    const connection = this.activeConnections.get(connectionId);

    if (connection) {
      connection.subject.next({
        type: 'test_ended',
        timestamp: new Date(),
      });
      // Complete the subject to close the connection
      connection.subject.complete();
    }

    const testConnection = this.activeTestConnections.get(studentId);
    if (testConnection) {
      testConnection.subject.next({
        type: 'test_ended',
        testId,
        timestamp: new Date(),
      });
      // Complete the subject to close the testConnection
      testConnection.subject.complete();
    }
  }

  /**
   * Send a test paused event
   */
  sendTestPaused(testId: string, studentId: string, remainingMs: number): void {
    const connectionId = `${testId}-${studentId}`;
    const connection = this.activeConnections.get(connectionId);

    if (connection) {
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      connection.subject.next({
        type: 'test_paused',
        remainingSeconds,
        remainingMs,
        timestamp: new Date(),
      });
    }

    const testConnection = this.activeTestConnections.get(studentId);
    if (testConnection) {
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      testConnection.subject.next({
        type: 'test_paused',
        testId,
        remainingSeconds,
        remainingMs,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Send a test resumed event
   */
  sendTestResumed(
    testId: string,
    studentId: string,
    remainingMs: number,
  ): void {
    const connectionId = `${testId}-${studentId}`;
    const connection = this.activeConnections.get(connectionId);

    if (connection) {
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      connection.subject.next({
        type: 'test_resumed',
        remainingSeconds,
        remainingMs,
        timestamp: new Date(),
      });
    }

    const testConnection = this.activeTestConnections.get(studentId);
    if (testConnection) {
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      testConnection.subject.next({
        type: 'test_resumed',
        testId,
        remainingSeconds,
        remainingMs,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Disconnect a student's SSE connection
   */
  disconnectStudent(testId: string, studentId: string): void {
    const connectionId = `${testId}-${studentId}`;
    const connection = this.activeConnections.get(connectionId);

    if (connection) {
      connection.subject.complete();
      this.activeConnections.delete(connectionId);
      this.logger.log(
        `SSE connection disconnected for test ${testId}, student ${studentId}`,
      );
    }

    const testConnection = this.activeTestConnections.get(studentId);

    if (testConnection) {
      testConnection.subject.complete();
      this.activeTestConnections.delete(studentId);
      this.logger.log(
        `SSE connection disconnected for test ${testId}, student ${studentId}`,
      );
    }
  }

  /**
   * Get all active SSE connections (useful for monitoring)
   */
  getActiveConnections(): StudentSSEConnection[] {
    return Array.from(this.activeConnections.values());
  }

  /**
   * Clean up all connections (useful on app shutdown)
   */
  clearAllConnections(): void {
    this.activeConnections.forEach((connection) => {
      connection.subject.complete();
    });
    this.activeConnections.clear();
    this.logger.log('All SSE connections cleared');
  }
}
