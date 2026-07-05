import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class EndTestProducer {
  private readonly logger = new Logger(EndTestProducer.name);

  constructor(
    @InjectQueue('end-test-queue') private readonly queue: Queue,
  ) {}

  async scheduleEndTest(
    testId: string,
    studentId: string,
    endTime: Date,
  ): Promise<void> {
    const delay = Math.max(0, endTime.getTime() - Date.now());

    await this.queue.add(
      'end-test',
      { testId, studentId },
      {
        jobId: testId,
        delay,
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: 1000,
      },
    );

    this.logger.log(`Scheduled end-test job for test ${testId} in ${delay}ms`);
  }

  async cancelEndTestJob(testId: string): Promise<void> {
    try {
      const job = await this.queue.getJob(testId);
      if (job) {
        await job.remove();
        this.logger.log(`Cancelled end-test job for test ${testId}`);
      }
    } catch (error) {
      // If the job is already active/locked (e.g. it started running right
      // as the student paused), it can't be removed. That's fine: the
      // consumer's PAUSED guard makes a late-firing job a safe no-op.
      this.logger.warn(
        `Failed to cancel end-test job for test ${testId}: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }
  }
}
