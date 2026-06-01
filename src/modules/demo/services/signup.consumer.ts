import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { PaymentService } from './payment.service';

const TRIAL_PLAN_KEY: Record<string, string> = {
  STUDENT: 'student_free',
  PARENT: 'parent_trial',
  ORGANIZATION: 'school_trial',
};

@Processor('signup-queue')
@Injectable()
export class SignupConsumer extends WorkerHost {
  private readonly logger = new Logger(SignupConsumer.name);

  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
    private readonly paymentService: PaymentService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'provision-free-trial': {
        const { email, role } = job.data as { email: string; role: string };

        const planKey = TRIAL_PLAN_KEY[role];
        if (!planKey) {
          this.logger.warn(`Unknown role "${role}" for free trial. Skipping.`);
          return;
        }

        const freePlan = await this.planRepo.findOne({
          where: { plan_key: planKey, is_active: true },
        });
        if (!freePlan) {
          this.logger.warn(
            `No active plan found for key "${planKey}". Skipping for ${email}`,
          );
          return;
        }

        await this.paymentService.activateFreeTrial(email, freePlan, role, []);
        this.logger.log(`Free trial provisioned for ${email} [${role}]`);
        break;
      }
    }
  }
}
