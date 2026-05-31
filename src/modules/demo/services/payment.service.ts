import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import * as crypto from 'crypto';
import { Organization } from 'src/modules/auth/entities/organization.entity';
import { Student } from 'src/modules/auth/entities/student.entity';
import { Child } from 'src/modules/parent/entities/child.entity';
import { Parent } from 'src/modules/parent/entities/parent.entity';
import { ParentSubscription } from 'src/modules/parent/entities/parent-subscription.entity';
import { Between, In, Repository } from 'typeorm';
import {
  OrgSubscription,
  SubscriptionStatus,
} from '../entities/organization-subscription.entity';
import { StudentSubscription } from '../entities/student-subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';

@Injectable()
export class PaymentService {
  private readonly paystackBaseUrl = 'https://api.paystack.co';

  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(OrgSubscription)
    private readonly orgSubscriptionRepo: Repository<OrgSubscription>,
    @InjectRepository(ParentSubscription)
    private readonly parentSubscriptionRepo: Repository<ParentSubscription>,
    @InjectRepository(StudentSubscription)
    private readonly studentSubscriptionRepo: Repository<StudentSubscription>,
    @InjectRepository(Child)
    private readonly childRepo: Repository<Child>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(Parent)
    private readonly parentRepo: Repository<Parent>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly configService: ConfigService,
  ) {}

  async listPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepo.find({ where: { is_active: true } });
  }

  async initiatePayment(
    email: string,
    planId: string,
    role: string,
    childrenIds: string[] = [],
  ): Promise<{ authorization_url: string; reference: string }> {
    const plan = await this.planRepo.findOne({
      where: { id: planId, is_active: true },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const now = new Date();

    if (role === 'PARENT') {
      const parent = await this.parentRepo.findOne({ where: { email } });
      if (parent && childrenIds.length > 0) {
        const ownedChildren = await this.childRepo.find({
          where: { parent: { id: parent.id } },
          select: ['id', 'full_name'],
        });
        const ownedIds = new Set(ownedChildren.map((c) => c.id));
        const childNameById = new Map(
          ownedChildren.map((c) => [c.id, c.full_name]),
        );
        const invalidIds = childrenIds.filter((id) => !ownedIds.has(id));
        if (invalidIds.length > 0) {
          throw new BadRequestException(
            `Children not found or not belonging to parent: ${invalidIds.join(', ')}`,
          );
        }

        for (const childId of childrenIds) {
          const activeSub = await this.parentSubscriptionRepo
            .createQueryBuilder('sub')
            .innerJoin('sub.children', 'child')
            .where('child.id = :childId', { childId })
            .andWhere('sub.status = :status', {
              status: SubscriptionStatus.ACTIVE,
            })
            .andWhere('sub.expires_at > :now', { now })
            .getOne();

          if (activeSub) {
            const childName = childNameById.get(childId) ?? childId;
            throw new BadRequestException(
              `${childName} already has an active subscription`,
            );
          }
        }
      }
    } else if (role === 'STUDENT') {
      const student = await this.studentRepo.findOne({ where: { email } });
      if (student) {
        const existingSub = await this.studentSubscriptionRepo.findOne({
          where: {
            student: { id: student.id },
            status: SubscriptionStatus.ACTIVE,
          },
          order: { expires_at: 'DESC' },
        });
        if (existingSub) {
          if (existingSub.expires_at > now) {
            throw new BadRequestException(
              'You already have an active subscription plan',
            );
          }
          existingSub.status = SubscriptionStatus.EXPIRED;
          await this.studentSubscriptionRepo.save(existingSub);
        }
      }
    } else {
      const org = await this.orgRepo.findOne({ where: { email } });
      if (org) {
        const existingSub = await this.orgSubscriptionRepo.findOne({
          where: {
            organization: { id: org.id },
            status: SubscriptionStatus.ACTIVE,
          },
          order: { expires_at: 'DESC' },
        });
        if (existingSub) {
          if (existingSub.expires_at > now) {
            throw new BadRequestException(
              'You already have an active subscription plan',
            );
          }
          existingSub.status = SubscriptionStatus.EXPIRED;
          await this.orgSubscriptionRepo.save(existingSub);
        }
      }
    }

    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');

    const count =
      role === 'PARENT' && childrenIds.length > 0 ? childrenIds.length : 1;
    const discount = plan.plan_key.startsWith('parent_') ? 0.8 : 1.0;
    const amountInKobo = Math.round(plan.price * discount * count * 100);

    let payerEmail: string;
    let metadata: Record<string, string>;
    let callbackUrl: string;

    if (role === 'PARENT') {
      const parent = await this.parentRepo.findOne({ where: { email } });
      if (!parent) throw new NotFoundException('Parent not found');
      payerEmail = parent.email;
      metadata = {
        parent_id: parent.id,
        plan_id: plan.id,
        plan_name: plan.name,
        children_ids: childrenIds.join(','),
      };
      const parentUrl = this.configService.get<string>(
        'PARENT_UI_URL',
        'http://localhost:3000',
      );
      callbackUrl = parentUrl + '/billing/callback';
    } else if (role === 'STUDENT') {
      const student = await this.studentRepo.findOne({ where: { email } });
      if (!student) throw new NotFoundException('Student not found');
      payerEmail = student.email;
      metadata = {
        student_id: student.id,
        plan_id: plan.id,
        plan_name: plan.name,
      };
      const studentUrl = this.configService.get<string>(
        'STUDENT_DEMO_URL',
        'http://localhost:3000',
      );
      callbackUrl = studentUrl + '/billing/callback';
    } else {
      const org = await this.orgRepo.findOne({ where: { email } });
      if (!org) throw new NotFoundException('Organization not found');
      payerEmail = org.email;
      metadata = { org_id: org.id, plan_id: plan.id, plan_name: plan.name };
      const schoolUrl = this.configService.get<string>(
        'SCHOOL_DEMO_URL',
        'http://localhost:3000',
      );
      callbackUrl = schoolUrl + '/payment/callback';
    }

    const response = await axios.post(
      `${this.paystackBaseUrl}/transaction/initialize`,
      {
        email: payerEmail,
        amount: amountInKobo,
        currency: plan.currency,
        metadata,
        callback_url: callbackUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const { authorization_url, reference } = response.data.data;
    return { authorization_url, reference };
  }

  verifyWebhookSignature(signature: string, rawBody: Buffer): void {
    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  async handleWebhookEvent(event: string, data: any): Promise<void> {
    if (event !== 'charge.success') return;

    const { reference, metadata, status } = data;
    if (status !== 'success') return;

    const { org_id, parent_id, student_id, plan_id, children_ids } =
      metadata ?? {};
    if (!plan_id || (!org_id && !parent_id && !student_id)) return;

    const plan = await this.planRepo.findOne({ where: { id: plan_id } });
    if (!plan) return;

    const startedAt = new Date();
    const expiresAt = new Date(startedAt);
    expiresAt.setDate(expiresAt.getDate() + Number(plan.duration_days));

    if (student_id) {
      const student = await this.studentRepo.findOne({
        where: { id: student_id },
      });
      if (!student) return;

      const existing = await this.studentSubscriptionRepo.findOne({
        where: { paystack_reference: reference },
      });
      if (existing) return;

      await this.studentSubscriptionRepo.save(
        this.studentSubscriptionRepo.create({
          student,
          plan,
          paystack_reference: reference,
          status: SubscriptionStatus.ACTIVE,
          started_at: startedAt,
          expires_at: expiresAt,
        }),
      );
    } else if (parent_id) {
      const parent = await this.parentRepo.findOne({
        where: { id: parent_id },
      });
      if (!parent) return;

      const existing = await this.parentSubscriptionRepo.findOne({
        where: { paystack_reference: reference },
      });
      if (existing) return;

      let coveredChildren: Child[] = [];
      if (children_ids) {
        const ids = children_ids.split(',').filter(Boolean);
        if (ids.length > 0) {
          coveredChildren = await this.childRepo.find({
            where: { id: In(ids) },
          });
        }
      }

      await this.parentSubscriptionRepo.save(
        this.parentSubscriptionRepo.create({
          parent,
          plan,
          paystack_reference: reference,
          status: SubscriptionStatus.ACTIVE,
          started_at: startedAt,
          expires_at: expiresAt,
          children: coveredChildren,
        }),
      );
    } else {
      const org = await this.orgRepo.findOne({ where: { id: org_id } });
      if (!org) return;

      const existing = await this.orgSubscriptionRepo.findOne({
        where: { paystack_reference: reference },
      });
      if (existing) return;

      await this.orgSubscriptionRepo.save(
        this.orgSubscriptionRepo.create({
          organization: org,
          plan,
          paystack_reference: reference,
          status: SubscriptionStatus.ACTIVE,
          started_at: startedAt,
          expires_at: expiresAt,
        }),
      );
    }
  }

  async getParentSubscription(
    parentEmail: string,
  ): Promise<ParentSubscription | null> {
    return this.parentSubscriptionRepo.findOne({
      where: {
        parent: { email: parentEmail },
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['plan', 'children'],
      order: { expires_at: 'DESC' },
    });
  }

  async listParentSubscriptions(
    parentEmail: string,
  ): Promise<ParentSubscription[]> {
    const year = new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    return this.parentSubscriptionRepo.find({
      where: {
        parent: { email: parentEmail },
        created_at: Between(start, end),
      },
      relations: ['plan', 'children'],
      order: { created_at: 'DESC' },
    });
  }

  async getStudentSubscription(
    studentEmail: string,
  ): Promise<StudentSubscription | null> {
    return this.studentSubscriptionRepo.findOne({
      where: {
        student: { email: studentEmail },
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['plan'],
      order: { expires_at: 'DESC' },
    });
  }

  async listStudentSubscriptions(
    studentEmail: string,
  ): Promise<StudentSubscription[]> {
    const year = new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    return this.studentSubscriptionRepo.find({
      where: {
        student: { email: studentEmail },
        created_at: Between(start, end),
      },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });
  }
}
