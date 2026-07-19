import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';

@Injectable()
export class EndTestProducer {
  private readonly log = this.loggerRegistry.getLogger('simulation');

  constructor(
    @InjectQueue('end-test-queue') private readonly queue: Queue,
    private readonly loggerRegistry: ModuleLoggerRegistry,
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

    this.log.info(
      { testId, studentId, delayMs: delay },
      'simulation.end_test.scheduled',
    );
  }

  async cancelEndTestJob(testId: string): Promise<void> {
    try {
      const job = await this.queue.getJob(testId);
      if (job) {
        await job.remove();
        this.log.info({ testId }, 'simulation.end_test.job_cancelled');
      }
    } catch (error) {
      // If the job is already active/locked (e.g. it started running right
      // as the student paused), it can't be removed. That's fine: the
      // consumer's PAUSED guard makes a late-firing job a safe no-op.
      this.log.warn(
        {
          testId,
          err: error instanceof Error ? error.message : error,
        },
        'simulation.end_test.job_cancel_failed',
      );
    }
  }
}
