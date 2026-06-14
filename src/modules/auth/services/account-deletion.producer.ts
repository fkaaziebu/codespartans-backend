import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

@Injectable()
export class AccountDeletionProducer {
  private readonly gracePeriodMs: number;

  constructor(
    @InjectQueue('account-deletion-queue')
    private readonly queue: Queue,
    private readonly configService: ConfigService,
  ) {
    this.gracePeriodMs =
      this.configService.get<number>('ACCOUNT_DELETION_GRACE_DAYS') *
      24 * 60 * 60 * 1000;
  }

  async scheduleStudentPurge(studentId: string): Promise<string> {
    const job = await this.queue.add(
      'purge-student-account',
      { studentId },
      { delay: this.gracePeriodMs },
    );
    return String(job.id);
  }

  async scheduleParentPurge(parentId: string): Promise<string> {
    const job = await this.queue.add(
      'purge-parent-account',
      { parentId },
      { delay: this.gracePeriodMs },
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
