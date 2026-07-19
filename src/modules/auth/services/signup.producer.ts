import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';

@Injectable()
export class SignupProducer {
  private readonly log = this.loggerRegistry.getLogger('auth');

  constructor(
    @InjectQueue('signup-queue') private readonly signupQueue: Queue,
    private readonly loggerRegistry: ModuleLoggerRegistry,
  ) {}

  async enqueueFreeTrial(data: { email: string; role: string }): Promise<void> {
    await this.signupQueue.add('provision-free-trial', data);
    this.log.info(data, 'auth.signup.free_trial_enqueued');
  }
}
