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

    console.log('Path:', templatePath);

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);
    return template(context);
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetToken: string,
  ): Promise<void> {
    const resetLink = `${this.configService.get<string>('APP_URL', 'http://localhost:3000')}/reset-password?token=${resetToken}&email=${to}`;
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
