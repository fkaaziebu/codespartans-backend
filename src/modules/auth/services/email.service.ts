import * as fs from 'node:fs';
import * as path from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
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
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('Email transporter verification failed:', error);
        } else {
          console.log('Email transporter is ready to take messages', success);
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
      console.error('Failed to send parent password reset email:', error);
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
      console.error('Failed to send password reset email:', error);
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
      console.error('Failed to send account validation email:', error);
      throw new Error('Failed to send account validation email');
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
      console.error('Failed to send demo invitation email:', error);
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
      console.error('Failed to send demo admin notification email:', error);
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
      console.error('Failed to send parent demo invitation email:', error);
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
      console.error('Failed to send student demo invitation email:', error);
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
      console.error('Failed to send lead admin notification email:', error);
      throw new Error('Failed to send lead admin notification email');
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
      console.error('Error validating email:', error);
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
      console.log('Activation email sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      return info;
    } catch (error) {
      console.error('Error sending activation email:', error);
      throw error;
    }
  }
}
