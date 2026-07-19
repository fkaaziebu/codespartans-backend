import * as fs from 'node:fs';
import * as path from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';

@Injectable()
export class EmailService {
  private readonly log = this.loggerRegistry.getLogger('auth');
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private readonly loggerRegistry: ModuleLoggerRegistry,
  ) {
    // this.createTestAccount();
    if (this.configService.get<string>('STAGE') === 'prod') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.configService.get<string>('GMAIL_USER'),
          pass: this.configService.get<string>('GMAIL_APP_PASSWORD'),
        },
      });

      // Verify the connection configuration
      this.transporter.verify((error) => {
        if (error) {
          this.log.error(
            { err: error.message },
            'auth.email.transporter_verification_failed',
          );
        } else {
          this.log.info({}, 'auth.email.transporter_ready');
        }
      });
    } else {
      this.createTestAccount();
    }
  }

  private async createTestAccount() {
    const testAccount = await nodemailer.createTestAccount();

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: 587,
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  private compileTemplate(templateName: string, context: any): string {
    const templatePath = path.join(
      __dirname,
      '/templates/',
      `${templateName}.hbs`,
    );

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);
    return template(context);
  }

  async sendParentPasswordResetEmail(
    to: string,
    name: string,
    resetToken: string,
  ): Promise<void> {
    const resetLink = `${this.configService.get<string>('PARENT_URL', 'http://localhost:3001')}/reset-password?token=${resetToken}&email=${to}`;
    const html = this.compileTemplate('password-reset', { name, resetLink });

    try {
      await this.sendMail(to, 'Reset Your Password', '', html);
    } catch (error) {
      this.log.error(
        { err: (error as Error).message },
        'auth.email.parent_password_reset_failed',
      );
      throw new Error('Failed to send parent password reset email');
    }
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetToken: string,
  ): Promise<void> {
    const resetLink = `${this.configService.get<string>('STUDENT_URL', 'http://localhost:3000')}/reset-password?token=${resetToken}&email=${to}`;
    const html = this.compileTemplate('password-reset', { name, resetLink });

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_FROM'),
      subject: 'Reset Your Password',
      to,
      html,
    };

    try {
      await this.sendMail(
        mailOptions.to,
        mailOptions.subject,
        '',
        mailOptions.html,
      );
    } catch (error) {
      this.log.error(
        { err: (error as Error).message },
        'auth.email.password_reset_failed',
      );
      throw new Error('Failed to send password reset email');
    }
  }

  async sendAccountValidationEmail(
    to: string,
    name: string,
    validationCode: string,
  ): Promise<void> {
    const html = this.compileTemplate('account-validation', {
      name,
      validationCode,
    });

    try {
      await this.sendMail(to, 'Verify Your Account', '', html);
    } catch (error) {
      this.log.error(
        { err: (error as Error).message },
        'auth.email.account_validation_failed',
      );
      throw new Error('Failed to send account validation email');
    }
  }

  async sendParentAccountAlreadyExistsEmail(
    to: string,
    name: string,
  ): Promise<void> {
    const loginUrl = `${this.configService.get<string>('PARENT_URL', 'http://localhost:3001')}/login`;
    const html = this.compileTemplate('parent-account-already-exists', {
      name,
      loginUrl,
    });

    try {
      await this.sendMail(to, 'You already have an account', '', html);
    } catch (error) {
      this.log.error(
        { err: (error as Error).message },
        'auth.email.parent_account_already_exists_failed',
      );
      throw new Error('Failed to send parent account already exists email');
    }
  }

  async sendDemoInvitationEmail(
    to: string,
    name: string,
    school_name: string,
  ): Promise<void> {
    const html = this.compileTemplate('demo-invitation', {
      name,
      school_name,
    });

    try {
      await this.sendMail(to, 'Your Free Demo Access – Codespartans', '', html);
    } catch (error) {
      this.log.error(
        { err: (error as Error).message },
        'auth.email.demo_invitation_failed',
      );
      throw new Error('Failed to send demo invitation email');
    }
  }

  async sendDemoAdminNotificationEmail(
    name: string,
    school_name: string,
    role: string,
    approximate_students: string,
    email: string,
    whatsapp_number: string,
  ): Promise<void> {
    const adminEmail = this.configService.get<string>('EMAIL_FROM');
    const html = this.compileTemplate('demo-admin-notification', {
      name,
      school_name,
      role,
      approximate_students,
      email,
      whatsapp_number,
    });

    try {
      await this.sendMail(
        adminEmail,
        `New Demo Request – ${school_name}`,
        '',
        html,
      );
    } catch (error) {
      this.log.error(
        { err: (error as Error).message },
        'auth.email.demo_admin_notification_failed',
      );
      throw new Error('Failed to send demo admin notification email');
    }
  }

  async sendParentDemoInvitationEmail(
    to: string,
    full_name: string,
    target_exams: string[],
    registrationUrl: string,
  ): Promise<void> {
    const target_exams_display = target_exams.join(', ');
    const html = this.compileTemplate('parent-demo-invitation', {
      full_name,
      target_exams_display,
      multipleExams: target_exams.length > 1,
      registrationUrl,
    });

    try {
      await this.sendMail(to, 'Get started for free – Codespartans', '', html);
    } catch (error) {
      this.log.error(
        { err: (error as Error).message },
        'auth.email.parent_demo_invitation_failed',
      );
      throw new Error('Failed to send parent demo invitation email');
    }
  }

  async sendStudentDemoInvitationEmail(
    to: string,
    full_name: string,
    target_exam: string,
    registrationUrl: string,
  ): Promise<void> {
    const html = this.compileTemplate('student-demo-invitation', {
      full_name,
      target_exam,
      registrationUrl,
    });

    try {
      await this.sendMail(to, 'Get started for free – Codespartans', '', html);
    } catch (error) {
      this.log.error(
        { err: (error as Error).message },
        'auth.email.student_demo_invitation_failed',
      );
      throw new Error('Failed to send student demo invitation email');
    }
  }

  async sendLeadAdminNotificationEmail(
    lead_type: string,
    full_name: string,
    email: string,
    target_exams_display: string,
    registrationUrl: string,
  ): Promise<void> {
    const adminEmail = this.configService.get<string>('EMAIL_FROM');
    const html = this.compileTemplate('lead-admin-notification', {
      lead_type,
      full_name,
      email,
      target_exams_display,
      registrationUrl,
    });

    try {
      await this.sendMail(
        adminEmail,
        `New Demo Lead – ${lead_type}: ${full_name}`,
        '',
        html,
      );
    } catch (error) {
      this.log.error(
        { err: (error as Error).message },
        'auth.email.lead_admin_notification_failed',
      );
      throw new Error('Failed to send lead admin notification email');
    }
  }

  async sendAccountDeletionNoticeEmail(
    to: string,
    name: string,
    gracePeriodEnd: string,
    userType: 'student' | 'parent',
    childCount = 0,
  ): Promise<void> {
    const baseUrl =
      userType === 'parent'
        ? this.configService.get<string>('PARENT_URL', 'http://localhost:3001')
        : this.configService.get<string>(
            'STUDENT_URL',
            'http://localhost:3000',
          );
    const loginUrl =
      userType === 'student' ? `${baseUrl}/signin` : `${baseUrl}/login`;
    const html = this.compileTemplate('account-deletion-notice', {
      name,
      gracePeriodEnd,
      loginUrl,
      isParent: userType === 'parent',
      childCount,
    });

    try {
      await this.sendMail(
        to,
        'Your Account Deletion Request – Examforge',
        '',
        html,
      );
    } catch (error) {
      this.log.error(
        { err: (error as Error).message },
        'auth.email.account_deletion_notice_failed',
      );
      throw new Error('Failed to send account deletion notice email');
    }
  }

  async sendChildDeletionNoticeEmail(
    to: string,
    parentName: string,
    childName: string,
    gracePeriodEnd: string,
  ): Promise<void> {
    const html = this.compileTemplate('child-deletion-notice', {
      parentName,
      childName,
      gracePeriodEnd,
    });

    try {
      await this.sendMail(
        to,
        'Child Account Deletion Requested – Examforge',
        '',
        html,
      );
    } catch (error) {
      this.log.error(
        { err: (error as Error).message },
        'auth.email.child_deletion_notice_failed',
      );
      throw new Error('Failed to send child deletion notice email');
    }
  }

  async sendAccountRestoredEmail(to: string, name: string): Promise<void> {
    const html = this.compileTemplate('account-restored', { name });

    try {
      await this.sendMail(
        to,
        'Your Account Has Been Restored – Examforge',
        '',
        html,
      );
    } catch (error) {
      this.log.error(
        { err: (error as Error).message },
        'auth.email.account_restored_failed',
      );
      throw new Error('Failed to send account restored email');
    }
  }

  async sendAccountPurgedConfirmationEmail(
    to: string,
    name: string,
  ): Promise<void> {
    const retentionYears = this.configService.get<number>(
      'PAYMENT_RETENTION_YEARS',
    );
    const html = this.compileTemplate('account-purged', {
      name,
      retentionYears,
    });

    try {
      await this.sendMail(
        to,
        'Your Account Has Been Deleted – Examforge',
        '',
        html,
      );
    } catch (error) {
      this.log.error(
        { err: (error as Error).message },
        'auth.email.account_purged_confirmation_failed',
      );
      throw new Error('Failed to send account purged confirmation email');
    }
  }

  async sendChildPinResetRequestEmail(
    to: string,
    parentName: string,
    childName: string,
  ): Promise<void> {
    const html = this.compileTemplate('child-pin-reset-request', {
      parentName,
      childName,
    });

    try {
      await this.sendMail(
        to,
        `${childName} is requesting a PIN reset – Examforge`,
        '',
        html,
      );
    } catch (error) {
      this.log.error(
        { err: (error as Error).message },
        'auth.email.child_pin_reset_request_failed',
      );
      throw new Error('Failed to send child PIN reset request email');
    }
  }

  async sendCancellationOtpEmail(
    to: string,
    name: string,
    otp: string,
  ): Promise<void> {
    const html = this.compileTemplate('cancellation-otp', { name, otp });

    try {
      await this.sendMail(
        to,
        'Cancel your account deletion – verification code',
        '',
        html,
      );
    } catch (error) {
      this.log.error(
        { err: (error as Error).message },
        'auth.email.cancellation_otp_failed',
      );
      throw new Error('Failed to send cancellation OTP email');
    }
  }

  async sendPurgeFailureAlertEmail(
    jobId: string,
    accountId: string,
    errorMessage: string,
  ): Promise<void> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const html = this.compileTemplate('purge-failure-alert', {
      jobId,
      accountId,
      errorMessage,
      occurredAt: new Date().toISOString(),
    });

    try {
      await this.sendMail(
        adminEmail,
        `[ACTION REQUIRED] Account purge failed – job ${jobId}`,
        '',
        html,
      );
    } catch (error) {
      this.log.error(
        { jobId, err: (error as Error).message },
        'auth.email.purge_failure_alert_failed',
      );
    }
  }

  async validateEmail(email: string): Promise<boolean> {
    const apiKey = this.configService.get<string>('ABSTRACT_API_KEY');
    const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${email}`;

    try {
      const response = await axios.get(url);
      const data = response.data;

      // Check if the email is deliverable
      return data.deliverability === 'DELIVERABLE';
    } catch (error) {
      this.log.error(
        { err: (error as Error).message },
        'auth.email.validation_failed',
      );
      return false;
    }
  }

  private async sendMail(
    to: string,
    subject: string,
    text: string,
    html: string,
  ) {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM'),
        to,
        subject,
        text,
        html,
      });
      this.log.info({ messageId: info.messageId }, 'auth.email.sent');
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.log.debug({ previewUrl }, 'auth.email.preview_url');
      }
      return info;
    } catch (error) {
      this.log.error(
        { err: (error as Error).message },
        'auth.email.send_failed',
      );
      throw error;
    }
  }
}
