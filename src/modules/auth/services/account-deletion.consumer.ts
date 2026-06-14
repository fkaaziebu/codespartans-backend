import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AccountDeletionService } from './account-deletion.service';

@Processor('account-deletion-queue')
export class AccountDeletionConsumer extends WorkerHost {
  constructor(private readonly accountDeletionService: AccountDeletionService) {
    super();
  }

  async process(job: Job) {
    try {
      switch (job.name) {
        case 'purge-student-account': {
          await this.accountDeletionService.permanentlyPurgeStudent(
            job.data.studentId,
          );
          break;
        }
        case 'purge-parent-account': {
          await this.accountDeletionService.permanentlyPurgeParent(
            job.data.parentId,
          );
          break;
        }
      }
    } catch (err) {
      await this.accountDeletionService.recordPurgeFailure(job, err);
      throw err;
    }
  }
}
