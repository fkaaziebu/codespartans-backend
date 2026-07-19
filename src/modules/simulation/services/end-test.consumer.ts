import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';
import { StudentService } from './student.service';

@Processor('end-test-queue')
export class EndTestConsumer extends WorkerHost {
  private readonly log = this.loggerRegistry.getLogger('simulation');

  constructor(
    private readonly studentService: StudentService,
    private readonly loggerRegistry: ModuleLoggerRegistry,
  ) {
    super();
  }

  async process(job: Job<{ testId: string; studentId: string }>) {
    switch (job.name) {
      case 'end-test': {
        const { testId, studentId } = job.data;
        this.log.info({ testId, studentId }, 'simulation.end_test.start');
        try {
          await this.studentService.endTestFromQueue({
            id: studentId,
            testId,
          });
          this.log.info({ testId, studentId }, 'simulation.end_test.completed');
        } catch (err) {
          this.log.error(
            { testId, studentId, err: err.message },
            'simulation.end_test.failed',
          );
          throw err;
        }
        break;
      }
    }
  }
}
