import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';
import { MarkAnswerService } from './mark-answer.service';

@Processor('mark-answer-queue')
export class MarkAnswerConsumer extends WorkerHost {
  private readonly log = this.loggerRegistry.getLogger('simulation');

  constructor(
    private readonly markAnswerService: MarkAnswerService,
    private readonly loggerRegistry: ModuleLoggerRegistry,
  ) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case 'mark-short-answer': {
        const { submittedAnswerId } = job.data as { submittedAnswerId: string };
        this.log.info({ submittedAnswerId }, 'simulation.mark_answer.start');
        try {
          await this.markAnswerService.markShortAnswer(submittedAnswerId);
          this.log.info(
            { submittedAnswerId },
            'simulation.mark_answer.completed',
          );
        } catch (err) {
          this.log.error(
            { submittedAnswerId, err: err.message },
            'simulation.mark_answer.failed',
          );
          throw err;
        }
        break;
      }
    }
  }
}
