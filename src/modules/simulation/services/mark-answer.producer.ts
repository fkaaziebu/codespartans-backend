import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class MarkAnswerProducer {
  constructor(
    @InjectQueue('mark-answer-queue') private readonly markAnswerQueue: Queue,
  ) {}

  async markShortAnswer(data: { submittedAnswerId: string }) {
    await this.markAnswerQueue.add('mark-short-answer', data);
  }
}
