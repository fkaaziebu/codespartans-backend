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
}
