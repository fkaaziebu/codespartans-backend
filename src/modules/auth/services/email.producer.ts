import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class EmailProducer {
  constructor(@InjectQueue('email-queue') private readonly emailQueue: Queue) {}

  async sendPasswordResetEmail(data: {
    email: string;
    name: string;
    resetCode: string;
  }) {
    await this.emailQueue.add('send-password-reset', data);
  }

  async sendParentPasswordResetEmail(data: {
    email: string;
    name: string;
    resetCode: string;
  }) {
    await this.emailQueue.add('send-parent-password-reset', data);
  }

  async sendAccountValidationEmail(data: {
    email: string;
    name: string;
    validationCode: string;
  }) {
    await this.emailQueue.add('send-account-validation', data);
  }

  async sendDemoInvitationEmail(data: {
    email: string;
    name: string;
    school_name: string;
  }) {
    await this.emailQueue.add('send-demo-invitation', data);
  }

  async sendDemoAdminNotificationEmail(data: {
    name: string;
    school_name: string;
    role: string;
    approximate_students: string;
    email: string;
    whatsapp_number: string;
  }) {
    await this.emailQueue.add('send-demo-admin-notification', data);
  }

  async sendParentDemoInvitationEmail(data: {
    email: string;
    full_name: string;
    target_exams: string[];
    registrationUrl: string;
  }) {
    await this.emailQueue.add('send-parent-demo-invitation', data);
  }

  async sendStudentDemoInvitationEmail(data: {
    email: string;
    full_name: string;
    target_exam: string;
    registrationUrl: string;
  }) {
    await this.emailQueue.add('send-student-demo-invitation', data);
  }

  async sendLeadAdminNotificationEmail(data: {
    lead_type: string;
    full_name: string;
    email: string;
    target_exams_display: string;
    registrationUrl: string;
  }) {
    await this.emailQueue.add('send-lead-admin-notification', data);
  }

  async sendAccountDeletionNotice(data: {
    email: string;
    name: string;
    gracePeriodEnd: string;
    userType: 'student' | 'parent';
    childCount?: number;
  }) {
    await this.emailQueue.add('send-account-deletion-notice', data);
  }

  async sendChildDeletionNotice(data: {
    parentEmail: string;
    parentName: string;
    childName: string;
    gracePeriodEnd: string;
  }) {
    await this.emailQueue.add('send-child-deletion-notice', data);
  }

  async sendAccountRestoredNotice(data: { email: string; name: string }) {
    await this.emailQueue.add('send-account-restored-notice', data);
  }

  async sendAccountPurgedConfirmation(data: { email: string; name: string }) {
    await this.emailQueue.add('send-account-purged-confirmation', data);
  }

  async sendPurgeFailureAlert(data: {
    jobId: string;
    accountId: string;
    errorMessage: string;
  }) {
    await this.emailQueue.add('send-purge-failure-alert', data);
  }

  async sendParentAccountAlreadyExistsEmail(data: {
    email: string;
    name: string;
  }) {
    await this.emailQueue.add('send-parent-account-already-exists', data);
  }

  async sendCancellationOtpEmail(data: {
    email: string;
    name: string;
    otp: string;
  }) {
    await this.emailQueue.add('send-cancellation-otp', data);
  }

  async sendChildPinResetRequestEmail(data: {
    email: string;
    parentName: string;
    childName: string;
  }) {
    await this.emailQueue.add('send-child-pin-reset-request', data);
  }
}
