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
      case 'send-parent-password-reset': {
        const { email, name, resetCode } = job.data;
        await this.emailService.sendParentPasswordResetEmail(email, name, resetCode);
        break;
      }
      case 'send-account-validation': {
        const { email, name, validationCode } = job.data;
        await this.emailService.sendAccountValidationEmail(
          email,
          name,
          validationCode,
        );
        break;
      }
      case 'send-demo-invitation': {
        const { email, name, school_name } = job.data;
        await this.emailService.sendDemoInvitationEmail(
          email,
          name,
          school_name,
        );
        break;
      }
      case 'send-demo-admin-notification': {
        const {
          name,
          school_name,
          role,
          approximate_students,
          email,
          whatsapp_number,
        } = job.data;
        await this.emailService.sendDemoAdminNotificationEmail(
          name,
          school_name,
          role,
          approximate_students,
          email,
          whatsapp_number,
        );
        break;
      }
      case 'send-parent-demo-invitation': {
        const { email, full_name, target_exams, registrationUrl } = job.data;
        await this.emailService.sendParentDemoInvitationEmail(
          email,
          full_name,
          target_exams,
          registrationUrl,
        );
        break;
      }
      case 'send-student-demo-invitation': {
        const { email, full_name, target_exam, registrationUrl } = job.data;
        await this.emailService.sendStudentDemoInvitationEmail(
          email,
          full_name,
          target_exam,
          registrationUrl,
        );
        break;
      }
      case 'send-lead-admin-notification': {
        const {
          lead_type,
          full_name,
          email,
          target_exams_display,
          registrationUrl,
        } = job.data;
        await this.emailService.sendLeadAdminNotificationEmail(
          lead_type,
          full_name,
          email,
          target_exams_display,
          registrationUrl,
        );
        break;
      }
      case 'send-account-deletion-notice': {
        const { email, name, gracePeriodEnd } = job.data;
        await this.emailService.sendAccountDeletionNoticeEmail(
          email,
          name,
          gracePeriodEnd,
        );
        break;
      }
      case 'send-account-restored-notice': {
        const { email, name } = job.data;
        await this.emailService.sendAccountRestoredEmail(email, name);
        break;
      }
      case 'send-account-purged-confirmation': {
        const { email, name } = job.data;
        await this.emailService.sendAccountPurgedConfirmationEmail(email, name);
        break;
      }
      case 'send-parent-account-already-exists': {
        const { email, name } = job.data;
        await this.emailService.sendParentAccountAlreadyExistsEmail(email, name);
        break;
      }
    }
  }
}
