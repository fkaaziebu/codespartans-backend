import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { HashHelper } from 'src/helpers';
import { Organization } from 'src/modules/auth/entities/organization.entity';
import { EmailProducer } from '../../auth/services/email.producer';
import { Repository } from 'typeorm';
import { ActivateSchoolDemoInput } from '../inputs/activate-school-demo.input';
import { BookParentFreeDemoInput } from '../inputs/book-parent-free-demo.input';
import { BookSchoolFreeDemoInput } from '../inputs/book-school-free-demo.input';
import { BookStudentFreeDemoInput } from '../inputs/book-student-free-demo.input';
import { DemoStatus, SchoolDemo } from '../entities/school-demo.entity';
import { ParentDemoRequest } from '../entities/parent-demo-request.entity';
import { StudentDemoRequest } from '../entities/student-demo-request.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { PaymentService } from './payment.service';

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  constructor(
    @InjectRepository(SchoolDemo)
    private readonly schoolDemoRepository: Repository<SchoolDemo>,
    @InjectRepository(ParentDemoRequest)
    private readonly parentDemoRepository: Repository<ParentDemoRequest>,
    @InjectRepository(StudentDemoRequest)
    private readonly studentDemoRepository: Repository<StudentDemoRequest>,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    private readonly emailProducer: EmailProducer,
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async bookSchoolFreeDemo(input: BookSchoolFreeDemoInput) {
    const existing = await this.schoolDemoRepository.findOne({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictException(
        'A demo has already been requested for this email address.',
      );
    }

    const demo_code = randomUUID();
    const baseUrl = this.configService.get<string>(
      'SCHOOL_DEMO_URL',
      'http://localhost:3000',
    );
    const registrationUrl = `${baseUrl}/register?demo_code=${demo_code}`;

    const demo = this.schoolDemoRepository.create({ ...input, demo_code });
    await this.schoolDemoRepository.save(demo);

    await this.emailProducer.sendDemoInvitationEmail({
      email: input.email,
      name: input.name,
      school_name: input.school_name,
      registrationUrl,
      trial_duration_days: demo.trial_duration_days,
    });

    await this.emailProducer.sendDemoAdminNotificationEmail({
      name: input.name,
      school_name: input.school_name,
      role: input.role,
      approximate_students: input.approximate_students,
      email: input.email,
      whatsapp_number: input.whatsapp_number,
      registrationUrl,
      trial_duration_days: demo.trial_duration_days,
    });

    return {
      message:
        'Your free demo has been booked! Check your email for the registration link.',
    };
  }

  async activateSchoolDemo(input: ActivateSchoolDemoInput) {
    const demo = await this.schoolDemoRepository.findOne({
      where: { demo_code: input.demo_code },
    });

    if (!demo) {
      throw new NotFoundException('Invalid demo code.');
    }

    if (demo.status !== DemoStatus.PENDING) {
      throw new BadRequestException(
        'This demo code has already been used or has expired.',
      );
    }

    const existingOrg = await this.orgRepository.findOne({
      where: { email: demo.email },
    });

    if (existingOrg) {
      throw new ConflictException(
        'An account already exists for this email address.',
      );
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + demo.trial_duration_days);

    const org = this.orgRepository.create({
      name: demo.school_name,
      email: demo.email,
      password: await HashHelper.encrypt(input.password),
      school_demo: demo,
    });

    demo.status = DemoStatus.ACTIVE;
    demo.activated_at = now;
    demo.expires_at = expiresAt;

    await this.orgRepository.manager.transaction(async (em) => {
      await em.save(SchoolDemo, demo);
      await em.save(Organization, org);
    });

    const payload = {
      id: org.id,
      name: org.name,
      email: org.email,
      role: 'ORGANIZATION',
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      org_name: org.name,
      email: org.email,
      expires_at: expiresAt.toISOString(),
    };
  }

  async bookParentFreeDemo(input: BookParentFreeDemoInput) {
    const existing = await this.parentDemoRepository.findOne({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictException(
        'A demo has already been requested for this email address.',
      );
    }

    const record = this.parentDemoRepository.create(input);
    await this.parentDemoRepository.save(record);

    const registrationUrl =
      this.configService.get<string>('PARENT_URL', 'http://localhost:3000') +
      '/register';

    const target_exams_display = input.target_exams.join(', ');

    await this.emailProducer.sendParentDemoInvitationEmail({
      email: input.email,
      full_name: input.full_name,
      target_exams: input.target_exams,
      registrationUrl,
    });

    await this.emailProducer.sendLeadAdminNotificationEmail({
      lead_type: 'Parent',
      full_name: input.full_name,
      email: input.email,
      target_exams_display,
      registrationUrl,
    });

    return {
      message:
        'Your free demo has been booked! Check your email to get started.',
    };
  }

  async bookStudentFreeDemo(input: BookStudentFreeDemoInput) {
    const existing = await this.studentDemoRepository.findOne({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictException(
        'A demo has already been requested for this email address.',
      );
    }

    const record = this.studentDemoRepository.create(input);
    await this.studentDemoRepository.save(record);

    const registrationUrl =
      this.configService.get<string>('STUDENT_URL', 'http://localhost:3000') +
      '/register';

    await this.emailProducer.sendStudentDemoInvitationEmail({
      email: input.email,
      full_name: input.full_name,
      target_exam: input.target_exam,
      registrationUrl,
    });

    await this.emailProducer.sendLeadAdminNotificationEmail({
      lead_type: 'Student',
      full_name: input.full_name,
      email: input.email,
      target_exams_display: input.target_exam,
      registrationUrl,
    });

    return {
      message:
        'Your free demo has been booked! Check your email to get started.',
    };
  }

  async listPlans(): Promise<SubscriptionPlan[]> {
    return this.paymentService.listPlans();
  }

  async initiatePayment(orgEmail: string, planId: string) {
    return this.paymentService.initiatePayment(orgEmail, planId);
  }
}
