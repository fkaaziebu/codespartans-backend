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
import { Student } from 'src/modules/auth/entities/student.entity';
import { Cart } from 'src/modules/inventory/entities/cart.entity';
import { Parent } from 'src/modules/parent/entities/parent.entity';
import { EmailProducer } from '../../auth/services/email.producer';
import { Repository } from 'typeorm';
import { ActivateParentDemoInput } from '../inputs/activate-parent-demo.input';
import { ActivateSchoolDemoInput } from '../inputs/activate-school-demo.input';
import { ActivateStudentDemoInput } from '../inputs/activate-student-demo.input';
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
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
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

    const demo = this.schoolDemoRepository.create({ ...input, demo_code });
    await this.schoolDemoRepository.save(demo);

    await this.emailProducer.sendDemoInvitationEmail({
      email: input.email,
      name: input.name,
      school_name: input.school_name,
    });

    await this.emailProducer.sendDemoAdminNotificationEmail({
      name: input.name,
      school_name: input.school_name,
      role: input.role,
      approximate_students: input.approximate_students,
      email: input.email,
      whatsapp_number: input.whatsapp_number,
    });

    return {
      message:
        'Your free demo has been booked! Check your email for the registration link.',
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

    const demo_code = randomUUID();
    const record = this.parentDemoRepository.create({ ...input, demo_code });
    await this.parentDemoRepository.save(record);

    const registrationUrl =
      this.configService.get<string>(
        'PARENT_DEMO_URL',
        'http://localhost:3000',
      ) + `/demo/register?demoCode=${demo_code}`;

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

    const demo_code = randomUUID();
    const record = this.studentDemoRepository.create({ ...input, demo_code });
    await this.studentDemoRepository.save(record);

    const registrationUrl =
      this.configService.get<string>(
        'STUDENT_DEMO_URL',
        'http://localhost:3000',
      ) + `/demo/register?demoCode=${demo_code}`;

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

  async activateStudentDemo(input: ActivateStudentDemoInput) {
    const demo = await this.studentDemoRepository.findOne({
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

    const existingStudent = await this.studentRepository.findOne({
      where: { email: demo.email },
    });

    if (existingStudent) {
      throw new ConflictException(
        'An account already exists for this email address.',
      );
    }

    const organization = await this.orgRepository.findOne({
      where: { email: this.configService.get('GENPOP_EMAIL') },
    });

    if (!organization) {
      throw new NotFoundException('Genpop organization not found.');
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + demo.trial_duration_days);

    const cart = this.cartRepository.create();
    const student = this.studentRepository.create({
      name: demo.full_name,
      email: demo.email,
      password: await HashHelper.encrypt(input.password),
      is_account_validated: true,
      organizations: [organization],
    });

    demo.status = DemoStatus.ACTIVE;
    demo.activated_at = now;
    demo.expires_at = expiresAt;

    await this.studentRepository.manager.transaction(async (em) => {
      await em.save(Cart, cart);
      student.cart = cart;
      await em.save(StudentDemoRequest, demo);
      await em.save(Student, student);
    });

    const payload = {
      id: student.id,
      name: student.name,
      email: student.email,
      role: 'STUDENT',
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: '30d' },
    );

    return {
      ...student,
      token: access_token,
      refresh_token,
      expires_at: expiresAt.toISOString(),
    };
  }

  async activateParentDemo(input: ActivateParentDemoInput) {
    const demo = await this.parentDemoRepository.findOne({
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

    const existingParent = await this.parentRepository.findOne({
      where: { email: demo.email },
    });

    if (existingParent) {
      throw new ConflictException(
        'An account already exists for this email address.',
      );
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + demo.trial_duration_days);

    const [first_name, ...rest] = demo.full_name.trim().split(' ');
    const last_name = rest.join(' ') || first_name;

    const parent = this.parentRepository.create({
      first_name,
      last_name,
      email: demo.email,
      password: await HashHelper.encrypt(input.password),
      is_account_validated: true,
      is_setup_completed: false,
    });

    demo.status = DemoStatus.ACTIVE;
    demo.activated_at = now;
    demo.expires_at = expiresAt;

    await this.parentRepository.manager.transaction(async (em) => {
      await em.save(ParentDemoRequest, demo);
      await em.save(Parent, parent);
    });

    const payload = {
      id: parent.id,
      name: `${parent.first_name} ${parent.last_name}`,
      email: parent.email,
      role: 'PARENT' as const,
    };

    const token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: '30d' },
    );

    return {
      ...parent,
      token,
      refresh_token,
      expires_at: expiresAt.toISOString(),
    };
  }

  async listPlans(): Promise<SubscriptionPlan[]> {
    return this.paymentService.listPlans();
  }

  async initiatePayment(orgEmail: string, planId: string) {
    return this.paymentService.initiatePayment(orgEmail, planId);
  }
}
