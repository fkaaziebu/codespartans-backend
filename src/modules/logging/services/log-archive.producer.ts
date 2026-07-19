import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

const REPEAT_JOB_ID = 'daily-log-archive';

@Injectable()
export class LogArchiveProducer implements OnModuleInit {
  constructor(
    @InjectQueue('log-archive-queue') private readonly archiveQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.archiveQueue.add(
      'archive-old-logs',
      {},
      {
        jobId: REPEAT_JOB_ID,
        repeat: { pattern: '0 2 * * *' }, // daily at 02:00
      },
    );
  }
}
