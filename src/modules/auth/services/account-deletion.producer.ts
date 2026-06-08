import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

@Injectable()
export class AccountDeletionProducer {
  constructor(
    @InjectQueue('account-deletion-queue')
    private readonly queue: Queue,
  ) {}

  async scheduleStudentPurge(studentId: string): Promise<string> {
    const job = await this.queue.add(
      'purge-student-account',
      { studentId },
      { delay: NINETY_DAYS_MS },
    );
    return String(job.id);
  }

  async scheduleParentPurge(parentId: string): Promise<string> {
    const job = await this.queue.add(
      'purge-parent-account',
      { parentId },
      { delay: NINETY_DAYS_MS },
    );
    return String(job.id);
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }
}
