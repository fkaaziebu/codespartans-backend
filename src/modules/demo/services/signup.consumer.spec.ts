import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { SignupConsumer } from './signup.consumer';
import { PaymentService } from './payment.service';
import { SubscriptionPlan, PlanInterval } from '../entities/subscription-plan.entity';

const makePlan = (plan_key: string): SubscriptionPlan =>
  ({
    id: 'plan-uuid',
    plan_key,
    name: 'Free Trial',
    price: 0,
    currency: 'GHS',
    interval: PlanInterval.MONTHLY,
    duration_days: 7,
    features: [],
    is_active: true,
    is_custom: false,
  }) as SubscriptionPlan;

const makeJob = (name: string, data: object): Job =>
  ({ name, data }) as unknown as Job;

describe('SignupConsumer', () => {
  let consumer: SignupConsumer;
  let planRepo: jest.Mocked<Repository<SubscriptionPlan>>;

  const mockPaymentService = {
    activateFreeTrial: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignupConsumer,
        {
          provide: getRepositoryToken(SubscriptionPlan),
          useValue: { findOne: jest.fn() },
        },
        { provide: PaymentService, useValue: mockPaymentService },
      ],
    }).compile();

    consumer = module.get<SignupConsumer>(SignupConsumer);
    planRepo = module.get(getRepositoryToken(SubscriptionPlan));
    jest.clearAllMocks();
  });

  describe('process — provision-free-trial', () => {
    it('finds the student_free plan and calls activateFreeTrial for STUDENT', async () => {
      const plan = makePlan('student_free');
      planRepo.findOne.mockResolvedValue(plan);

      await consumer.process(makeJob('provision-free-trial', { email: 'student@test.com', role: 'STUDENT' }));

      expect(planRepo.findOne).toHaveBeenCalledWith({
        where: { plan_key: 'student_free', is_active: true },
      });
      expect(mockPaymentService.activateFreeTrial).toHaveBeenCalledWith(
        'student@test.com',
        plan,
        'STUDENT',
        [],
      );
    });

    it('finds the parent_trial plan and calls activateFreeTrial for PARENT', async () => {
      const plan = makePlan('parent_trial');
      planRepo.findOne.mockResolvedValue(plan);

      await consumer.process(makeJob('provision-free-trial', { email: 'parent@test.com', role: 'PARENT' }));

      expect(planRepo.findOne).toHaveBeenCalledWith({
        where: { plan_key: 'parent_trial', is_active: true },
      });
      expect(mockPaymentService.activateFreeTrial).toHaveBeenCalledWith(
        'parent@test.com',
        plan,
        'PARENT',
        [],
      );
    });

    it('finds the school_trial plan and calls activateFreeTrial for ORGANIZATION', async () => {
      const plan = makePlan('school_trial');
      planRepo.findOne.mockResolvedValue(plan);

      await consumer.process(makeJob('provision-free-trial', { email: 'org@test.com', role: 'ORGANIZATION' }));

      expect(planRepo.findOne).toHaveBeenCalledWith({
        where: { plan_key: 'school_trial', is_active: true },
      });
      expect(mockPaymentService.activateFreeTrial).toHaveBeenCalledWith(
        'org@test.com',
        plan,
        'ORGANIZATION',
        [],
      );
    });

    it('skips processing for an unknown role', async () => {
      await consumer.process(makeJob('provision-free-trial', { email: 'x@test.com', role: 'ADMIN' }));

      expect(planRepo.findOne).not.toHaveBeenCalled();
      expect(mockPaymentService.activateFreeTrial).not.toHaveBeenCalled();
    });

    it('skips processing when no matching plan is found', async () => {
      planRepo.findOne.mockResolvedValue(null);

      await consumer.process(makeJob('provision-free-trial', { email: 'student@test.com', role: 'STUDENT' }));

      expect(planRepo.findOne).toHaveBeenCalled();
      expect(mockPaymentService.activateFreeTrial).not.toHaveBeenCalled();
    });

    it('propagates errors from activateFreeTrial so BullMQ can retry', async () => {
      const plan = makePlan('student_free');
      planRepo.findOne.mockResolvedValue(plan);
      mockPaymentService.activateFreeTrial.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        consumer.process(makeJob('provision-free-trial', { email: 'student@test.com', role: 'STUDENT' })),
      ).rejects.toThrow('DB error');
    });
  });
});
