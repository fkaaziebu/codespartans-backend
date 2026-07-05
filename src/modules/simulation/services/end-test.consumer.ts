import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { StudentService } from './student.service';

@Processor('end-test-queue')
export class EndTestConsumer extends WorkerHost {
  private readonly logger = new Logger(EndTestConsumer.name);

  constructor(private readonly studentService: StudentService) {
    super();
  }

  async process(job: Job<{ testId: string; studentId: string }>) {
    switch (job.name) {
      case 'end-test': {
        const { testId, studentId } = job.data;
        this.logger.log(`Processing end-test job for test ${testId}`);
        await this.studentService.endTestFromQueue({
          id: studentId,
          testId,
        });
        break;
      }
    }
  }
}
