import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';
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
  private readonly log = this.loggerRegistry.getLogger('demo');

  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
    private readonly paymentService: PaymentService,
    private readonly loggerRegistry: ModuleLoggerRegistry,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'provision-free-trial': {
        const { email, role } = job.data as { email: string; role: string };

        const planKey = TRIAL_PLAN_KEY[role];
        if (!planKey) {
          this.log.warn({ role }, 'demo.signup.unknown_role');
          return;
        }

        const freePlan = await this.planRepo.findOne({
          where: { plan_key: planKey, is_active: true },
        });
        if (!freePlan) {
          this.log.warn({ planKey }, 'demo.signup.no_active_plan');
          return;
        }

        await this.paymentService.activateFreeTrial(email, freePlan, role, []);
        this.log.info({ role }, 'demo.signup.free_trial_provisioned');
        break;
      }
    }
  }
}
