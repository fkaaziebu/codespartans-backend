import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class EmailProducer {
  constructor(@InjectQueue('email-queue') private readonly emailQueue: Queue) {}

  async sendPasswordResetEmail(data: {
    email: string;
    name: string;
    resetCode: string;
  }) {
    await this.emailQueue.add('send-password-reset', data);
  }
}
