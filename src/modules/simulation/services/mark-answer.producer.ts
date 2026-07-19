import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';

@Injectable()
export class MarkAnswerProducer {
  private readonly log = this.loggerRegistry.getLogger('simulation');

  constructor(
    @InjectQueue('mark-answer-queue') private readonly markAnswerQueue: Queue,
    private readonly loggerRegistry: ModuleLoggerRegistry,
  ) {}

  async markShortAnswer(data: { submittedAnswerId: string }) {
    await this.markAnswerQueue.add('mark-short-answer', data);
    this.log.info(data, 'simulation.mark_answer.enqueued');
  }
}
