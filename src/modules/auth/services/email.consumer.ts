import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from './email.service';

@Processor('email-queue')
export class EmailConsumer extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case 'send-password-reset': {
        const { email, name, resetCode } = job.data;

        await this.emailService.sendPasswordResetEmail(email, name, resetCode);

        break;
      }
    }
  }
}
