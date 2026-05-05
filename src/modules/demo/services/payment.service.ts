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
import { Repository } from 'typeorm';
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
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    private readonly configService: ConfigService,
  ) {}

  async listPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepo.find({ where: { is_active: true } });
  }

  async initiatePayment(
    orgEmail: string,
    planId: string,
  ): Promise<{ authorization_url: string; reference: string }> {
    const org = await this.orgRepo.findOne({ where: { email: orgEmail } });
    if (!org) throw new NotFoundException('Organization not found');

    const plan = await this.planRepo.findOne({
      where: { id: planId, is_active: true },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    const amountInKobo = Math.round(plan.price * 100);

    const response = await axios.post(
      `${this.paystackBaseUrl}/transaction/initialize`,
      {
        email: org.email,
        amount: amountInKobo,
        currency: plan.currency,
        metadata: {
          org_id: org.id,
          plan_id: plan.id,
          plan_name: plan.name,
        },
        callback_url: this.configService.get<string>(
          'SCHOOL_DEMO_URL',
          'http://localhost:3000',
        ) + '/payment/callback',
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

    const { org_id, plan_id } = metadata ?? {};
    if (!org_id || !plan_id) return;

    const org = await this.orgRepo.findOne({ where: { id: org_id } });
    const plan = await this.planRepo.findOne({ where: { id: plan_id } });

    if (!org || !plan) return;

    // Idempotency — skip if this reference was already processed
    const existing = await this.orgSubscriptionRepo.findOne({
      where: { paystack_reference: reference },
    });
    if (existing) return;

    const startedAt = new Date();
    const expiresAt = new Date(startedAt);
    expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

    const subscription = this.orgSubscriptionRepo.create({
      organization: org,
      plan,
      paystack_reference: reference,
      status: SubscriptionStatus.ACTIVE,
      started_at: startedAt,
      expires_at: expiresAt,
    });

    await this.orgSubscriptionRepo.save(subscription);
  }
}
