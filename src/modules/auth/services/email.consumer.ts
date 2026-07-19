import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';
import { EmailService } from './email.service';

@Processor('email-queue')
export class EmailConsumer extends WorkerHost {
  private readonly log = this.loggerRegistry.getLogger('auth');

  constructor(
    private readonly emailService: EmailService,
    private readonly loggerRegistry: ModuleLoggerRegistry,
  ) {
    super();
  }

  async process(job: Job) {
    // job.data always carries an email and often a live reset/OTP/validation
    // code, so only the job name is ever logged here (SEC-001).
    try {
      await this.dispatch(job);
      this.log.info({ job: job.name }, 'auth.email.sent');
    } catch (err) {
      this.log.error(
        { job: job.name, err: (err as Error).message },
        'auth.email.send_failed',
      );
      throw err;
    }
  }

  private async dispatch(job: Job) {
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
        const { email, name, gracePeriodEnd, userType, childCount } = job.data;
        await this.emailService.sendAccountDeletionNoticeEmail(
          email,
          name,
          gracePeriodEnd,
          userType,
          childCount,
        );
        break;
      }
      case 'send-child-deletion-notice': {
        const { parentEmail, parentName, childName, gracePeriodEnd } = job.data;
        await this.emailService.sendChildDeletionNoticeEmail(
          parentEmail,
          parentName,
          childName,
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
      case 'send-purge-failure-alert': {
        const { jobId, accountId, errorMessage } = job.data;
        await this.emailService.sendPurgeFailureAlertEmail(
          jobId,
          accountId,
          errorMessage,
        );
        break;
      }
      case 'send-cancellation-otp': {
        const { email, name, otp } = job.data;
        await this.emailService.sendCancellationOtpEmail(email, name, otp);
        break;
      }
      case 'send-child-pin-reset-request': {
        const { email, parentName, childName } = job.data;
        await this.emailService.sendChildPinResetRequestEmail(
          email,
          parentName,
          childName,
        );
        break;
      }
    }
  }
}
