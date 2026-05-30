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
import { Parent } from 'src/modules/parent/entities/parent.entity';
import { ParentSubscription } from 'src/modules/parent/entities/parent-subscription.entity';
import { Between, Repository } from 'typeorm';
import {
  OrgSubscription,
  SubscriptionStatus,
} from '../entities/organization-subscription.entity';
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
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(Parent)
    private readonly parentRepo: Repository<Parent>,
    private readonly configService: ConfigService,
  ) {}

  async listPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepo.find({ where: { is_active: true } });
  }

  async initiatePayment(
    email: string,
    planId: string,
    role: string,
    childrenCount = 1,
  ): Promise<{ authorization_url: string; reference: string }> {
    const plan = await this.planRepo.findOne({
      where: { id: planId, is_active: true },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');

    // For parent plans, calculate amount based on children count with family discount
    const isParentPlan = plan.plan_key.startsWith('parent_');
    const familyDiscount = isParentPlan && childrenCount > 1 ? 0.8 : 1.0;
    const amountInKobo = Math.round(
      plan.price * childrenCount * familyDiscount * 100,
    );

    let payerEmail: string;
    let metadata: Record<string, string>;
    let callbackUrl: string;
    let webhookUrl: string;

    if (role === 'PARENT') {
      const parent = await this.parentRepo.findOne({ where: { email } });
      if (!parent) throw new NotFoundException('Parent not found');
      payerEmail = parent.email;
      metadata = {
        parent_id: parent.id,
        plan_id: plan.id,
        plan_name: plan.name,
      };
      callbackUrl =
        this.configService.get<string>(
          'PARENT_UI_URL',
          'http://localhost:3000',
        ) + '/billing/callback';
    } else {
      const org = await this.orgRepo.findOne({ where: { email } });
      if (!org) throw new NotFoundException('Organization not found');
      payerEmail = org.email;
      metadata = { org_id: org.id, plan_id: plan.id, plan_name: plan.name };
      callbackUrl =
        this.configService.get<string>(
          'SCHOOL_DEMO_URL',
          'http://localhost:3000',
        ) + '/payment/callback';
      webhookUrl =
        this.configService.get<string>(
          'REST_BASE_URL',
          'http://localhost:3000',
        ) + '/payments/paystack/webhook';
    }

    const response = await axios.post(
      `${this.paystackBaseUrl}/transaction/initialize`,
      {
        email: payerEmail,
        amount: amountInKobo,
        currency: plan.currency,
        metadata,
        callback_url: callbackUrl,
        webhook_url: webhookUrl,
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

    const { org_id, parent_id, plan_id } = metadata ?? {};
    if (!plan_id || (!org_id && !parent_id)) return;

    const plan = await this.planRepo.findOne({ where: { id: plan_id } });
    if (!plan) return;

    const startedAt = new Date();
    const expiresAt = new Date(startedAt);
    expiresAt.setDate(expiresAt.getDate() + Number(plan.duration_days));

    if (parent_id) {
      const parent = await this.parentRepo.findOne({
        where: { id: parent_id },
      });
      if (!parent) return;

      const existing = await this.parentSubscriptionRepo.findOne({
        where: { paystack_reference: reference },
      });
      if (existing) return;

      await this.parentSubscriptionRepo.save(
        this.parentSubscriptionRepo.create({
          parent,
          plan,
          paystack_reference: reference,
          status: SubscriptionStatus.ACTIVE,
          started_at: startedAt,
          expires_at: expiresAt,
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
      relations: ['plan'],
      order: { expires_at: 'DESC' },
    });
  }

  async listParentSubscriptions(parentEmail: string): Promise<ParentSubscription[]> {
    const year = new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    return this.parentSubscriptionRepo.find({
      where: {
        parent: { email: parentEmail },
        created_at: Between(start, end),
      },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });
  }
}
