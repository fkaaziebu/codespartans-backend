import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class SignupProducer {
  constructor(
    @InjectQueue('signup-queue') private readonly signupQueue: Queue,
  ) {}

  async enqueueFreeTrial(data: { email: string; role: string }): Promise<void> {
    await this.signupQueue.add('provision-free-trial', data);
  }
}
