import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';

@Injectable()
export class EmailProducer {
  private readonly log = this.loggerRegistry.getLogger('auth');

  constructor(
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    private readonly loggerRegistry: ModuleLoggerRegistry,
  ) {}

  private async enqueue(jobName: string, data: Record<string, unknown>) {
    await this.emailQueue.add(jobName, data);
    // Never log `data` here — every payload shape in this file carries an
    // email and often a live reset/OTP/validation code (SEC-001).
    this.log.info({ job: jobName }, 'auth.email.enqueued');
  }

  async sendPasswordResetEmail(data: {
    email: string;
    name: string;
    resetCode: string;
  }) {
    await this.enqueue('send-password-reset', data);
  }

  async sendParentPasswordResetEmail(data: {
    email: string;
    name: string;
    resetCode: string;
  }) {
    await this.enqueue('send-parent-password-reset', data);
  }

  async sendAccountValidationEmail(data: {
    email: string;
    name: string;
    validationCode: string;
  }) {
    await this.enqueue('send-account-validation', data);
  }

  async sendDemoInvitationEmail(data: {
    email: string;
    name: string;
    school_name: string;
  }) {
    await this.enqueue('send-demo-invitation', data);
  }

  async sendDemoAdminNotificationEmail(data: {
    name: string;
    school_name: string;
    role: string;
    approximate_students: string;
    email: string;
    whatsapp_number: string;
  }) {
    await this.enqueue('send-demo-admin-notification', data);
  }

  async sendParentDemoInvitationEmail(data: {
    email: string;
    full_name: string;
    target_exams: string[];
    registrationUrl: string;
  }) {
    await this.enqueue('send-parent-demo-invitation', data);
  }

  async sendStudentDemoInvitationEmail(data: {
    email: string;
    full_name: string;
    target_exam: string;
    registrationUrl: string;
  }) {
    await this.enqueue('send-student-demo-invitation', data);
  }

  async sendLeadAdminNotificationEmail(data: {
    lead_type: string;
    full_name: string;
    email: string;
    target_exams_display: string;
    registrationUrl: string;
  }) {
    await this.enqueue('send-lead-admin-notification', data);
  }

  async sendAccountDeletionNotice(data: {
    email: string;
    name: string;
    gracePeriodEnd: string;
    userType: 'student' | 'parent';
    childCount?: number;
  }) {
    await this.enqueue('send-account-deletion-notice', data);
  }

  async sendChildDeletionNotice(data: {
    parentEmail: string;
    parentName: string;
    childName: string;
    gracePeriodEnd: string;
  }) {
    await this.enqueue('send-child-deletion-notice', data);
  }

  async sendAccountRestoredNotice(data: { email: string; name: string }) {
    await this.enqueue('send-account-restored-notice', data);
  }

  async sendAccountPurgedConfirmation(data: { email: string; name: string }) {
    await this.enqueue('send-account-purged-confirmation', data);
  }

  async sendPurgeFailureAlert(data: {
    jobId: string;
    accountId: string;
    errorMessage: string;
  }) {
    await this.enqueue('send-purge-failure-alert', data);
  }

  async sendParentAccountAlreadyExistsEmail(data: {
    email: string;
    name: string;
  }) {
    await this.enqueue('send-parent-account-already-exists', data);
  }

  async sendCancellationOtpEmail(data: {
    email: string;
    name: string;
    otp: string;
  }) {
    await this.enqueue('send-cancellation-otp', data);
  }

  async sendChildPinResetRequestEmail(data: {
    email: string;
    parentName: string;
    childName: string;
  }) {
    await this.enqueue('send-child-pin-reset-request', data);
  }
}
