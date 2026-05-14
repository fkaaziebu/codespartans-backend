import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MarkAnswerService } from './mark-answer.service';

@Processor('mark-answer-queue')
export class MarkAnswerConsumer extends WorkerHost {
  constructor(private readonly markAnswerService: MarkAnswerService) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case 'mark-short-answer': {
        const { submittedAnswerId } = job.data as { submittedAnswerId: string };
        await this.markAnswerService.markShortAnswer(submittedAnswerId);
        break;
      }
    }
  }
}
