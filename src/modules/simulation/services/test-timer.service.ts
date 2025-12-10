import { Injectable, Logger } from '@nestjs/common';

interface TestTimer {
  testId: string;
  studentId: string;
  endTime: Date;
  interval: NodeJS.Timeout;
}

@Injectable()
export class TestTimerService {
  private readonly logger = new Logger(TestTimerService.name);
  private activeTimers = new Map<string, TestTimer>();

  /**
   * Start a countdown timer for a test
   * @param testId - The ID of the test
   * @param studentId - The ID of the student
   * @param endTime - When the test should end
   * @param onTick - Callback function called every second with remaining time
   * @param onEnd - Callback function called when test ends
   */
  startTimer(
    testId: string,
    studentId: string,
    endTime: Date,
    onTick: (remainingMs: number) => void,
    onEnd: () => void,
  ): void {
    const timerId = `${testId}-${studentId}`;

    // Clear any existing timer for this test-student combination
    this.stopTimer(testId, studentId);

    const interval = setInterval(() => {
      const now = new Date();
      const remainingMs = endTime.getTime() - now.getTime();

      if (remainingMs <= 0) {
        // Test time has ended
        this.logger.log(`Test ${testId} for student ${studentId} has ended`);
        this.stopTimer(testId, studentId);
        onEnd();
      } else {
        // Still time remaining, send update

        onTick(remainingMs);
      }
    }, 1000); // Update every second

    this.activeTimers.set(timerId, {
      testId,
      studentId,
      endTime,
      interval,
    });

    this.logger.log(
      `Timer started for test ${testId}, student ${studentId}. Ends at ${endTime}`,
    );
  }

  /**
   * Stop a running timer
   */
  stopTimer(testId: string, studentId: string): void {
    const timerId = `${testId}-${studentId}`;
    const timer = this.activeTimers.get(timerId);

    if (timer) {
      clearInterval(timer.interval);
      this.activeTimers.delete(timerId);
      this.logger.log(`Timer stopped for test ${testId}, student ${studentId}`);
    }
  }

  /**
   * Get remaining time for a test without starting a timer
   * Useful for reconnection scenarios
   */
  getRemainingTime(endTime: Date): number {
    const now = new Date();
    return Math.max(0, endTime.getTime() - now.getTime());
  }

  /**
   * Check if a test has expired
   */
  hasTestExpired(endTime: Date): boolean {
    return this.getRemainingTime(endTime) <= 0;
  }

  /**
   * Pause a timer and return remaining time
   */
  pauseTimer(testId: string, studentId: string): number | null {
    const timerId = `${testId}-${studentId}`;
    const timer = this.activeTimers.get(timerId);

    if (timer) {
      const now = new Date();
      const remainingMs = timer.endTime.getTime() - now.getTime();
      this.stopTimer(testId, studentId);
      this.logger.log(
        `Timer paused for test ${testId}, student ${studentId}. Remaining: ${remainingMs}ms`,
      );
      return remainingMs;
    }

    return null;
  }

  /**
   * Resume a paused timer
   */
  resumeTimer(
    testId: string,
    studentId: string,
    endTime: Date,
    onTick: (remainingMs: number) => void,
    onEnd: () => void,
  ): void {
    this.startTimer(testId, studentId, endTime, onTick, onEnd);
    this.logger.log(
      `Timer resumed for test ${testId}, student ${studentId}. New end time: ${endTime}`,
    );
  }

  /**
   * Get all active timers (useful for monitoring)
   */
  getActiveTimers(): TestTimer[] {
    return Array.from(this.activeTimers.values());
  }

  /**
   * Clean up all timers (useful on app shutdown)
   */
  clearAllTimers(): void {
    this.activeTimers.forEach((timer) => {
      clearInterval(timer.interval);
    });
    this.activeTimers.clear();
    this.logger.log('All timers cleared');
  }
}
