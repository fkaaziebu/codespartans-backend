import { BadRequestException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import * as crypto from 'crypto';
import {
  entities,
  Organization,
  OrgSubscription,
  Student,
  StudentSubscription,
  SubscriptionPlan,
} from '../../../database/entities';
import { SubscriptionStatus } from '../entities/organization-subscription.entity';
import { PlanInterval } from '../entities/subscription-plan.entity';
import { HashHelper } from '../../../helpers';
import { PaymentService } from './payment.service';

describe('PaymentService — trial-to-paid upgrade', () => {
  let module: TestingModule;
  let connection: Connection;
  let paymentService: PaymentService;

  let studentRepository: Repository<Student>;
  let orgRepository: Repository<Organization>;
  let planRepository: Repository<SubscriptionPlan>;
  let studentSubscriptionRepository: Repository<StudentSubscription>;
  let orgSubscriptionRepository: Repository<OrgSubscription>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test.local' }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            type: 'postgres',
            url: configService.get<string>('DATABASE_URL'),
            entities,
            synchronize: true,
          }),
          inject: [ConfigService],
        }),
        TypeOrmModule.forFeature(entities),
      ],
      providers: [PaymentService],
    }).compile();

    connection = module.get<Connection>(Connection);
    paymentService = module.get<PaymentService>(PaymentService);
    studentRepository = module.get<Repository<Student>>(getRepositoryToken(Student));
    orgRepository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    planRepository = module.get<Repository<SubscriptionPlan>>(getRepositoryToken(SubscriptionPlan));
    studentSubscriptionRepository = module.get<Repository<StudentSubscription>>(
      getRepositoryToken(StudentSubscription),
    );
    orgSubscriptionRepository = module.get<Repository<OrgSubscription>>(
      getRepositoryToken(OrgSubscription),
    );
  });

  beforeEach(async () => {
    const entityMetadatas = connection.entityMetadatas;
    for (const entity of entityMetadatas) {
      const repository = connection.getRepository(entity.name);
      await repository.query(`TRUNCATE "${entity.tableName}" CASCADE;`);
    }
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await connection.close();
    await module.close();
  });

  // ─── helpers ────────────────────────────────────────────────────────────────

  const makeFreePlan = (plan_key = 'student_free') =>
    planRepository.save(
      planRepository.create({
        plan_key,
        name: 'Free Trial',
        price: 0,
        currency: 'GHS',
        interval: PlanInterval.MONTHLY,
        duration_days: 7,
        features: [],
        is_active: true,
        is_custom: false,
      }),
    );

  const makePaidPlan = (plan_key = 'student_monthly') =>
    planRepository.save(
      planRepository.create({
        plan_key,
        name: 'Monthly',
        price: 50,
        currency: 'GHS',
        interval: PlanInterval.MONTHLY,
        duration_days: 30,
        features: [],
        is_active: true,
        is_custom: false,
      }),
    );

  const makeStudent = async (email = 'student@test.com') => {
    const s = studentRepository.create({
      name: 'Test Student',
      email,
      password: await HashHelper.encrypt('password'),
      is_account_validated: true,
    });
    return studentRepository.save(s);
  };

  const makeOrg = async (email = 'org@test.com') => {
    const o = orgRepository.create({
      name: 'Test Org',
      email,
      password: await HashHelper.encrypt('password'),
    });
    return orgRepository.save(o);
  };

  const seedActiveTrialForStudent = async (student: Student, plan: SubscriptionPlan) => {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 7);
    return studentSubscriptionRepository.save(
      studentSubscriptionRepository.create({
        student,
        plan,
        paystack_reference: `free_trial_${crypto.randomUUID()}`,
        status: SubscriptionStatus.ACTIVE,
        started_at: now,
        expires_at: expiresAt,
      }),
    );
  };

  const seedActiveTrialForOrg = async (org: Organization, plan: SubscriptionPlan) => {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 7);
    return orgSubscriptionRepository.save(
      orgSubscriptionRepository.create({
        organization: org,
        plan,
        paystack_reference: `free_trial_${crypto.randomUUID()}`,
        status: SubscriptionStatus.ACTIVE,
        started_at: now,
        expires_at: expiresAt,
      }),
    );
  };

  const seedActivePaidSubForStudent = async (student: Student, plan: SubscriptionPlan) => {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30);
    return studentSubscriptionRepository.save(
      studentSubscriptionRepository.create({
        student,
        plan,
        paystack_reference: `paid_${crypto.randomUUID()}`,
        status: SubscriptionStatus.ACTIVE,
        started_at: now,
        expires_at: expiresAt,
      }),
    );
  };

  const seedActivePaidSubForOrg = async (org: Organization, plan: SubscriptionPlan) => {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30);
    return orgSubscriptionRepository.save(
      orgSubscriptionRepository.create({
        organization: org,
        plan,
        paystack_reference: `paid_${crypto.randomUUID()}`,
        status: SubscriptionStatus.ACTIVE,
        started_at: now,
        expires_at: expiresAt,
      }),
    );
  };

  // ─── STUDENT ────────────────────────────────────────────────────────────────

  describe('initiatePayment — STUDENT trial-to-paid upgrade', () => {
    it('expires the active trial and creates a new subscription when student upgrades from trial', async () => {
      const student = await makeStudent();
      const trialPlan = await makeFreePlan('student_free');
      const newPlan = await makeFreePlan('student_free_2');

      const trial = await seedActiveTrialForStudent(student, trialPlan);

      await paymentService.initiatePayment(student.email, newPlan.id, 'STUDENT');

      const refreshedTrial = await studentSubscriptionRepository.findOne({
        where: { id: trial.id },
      });
      expect(refreshedTrial.status).toBe(SubscriptionStatus.EXPIRED);

      const newSub = await studentSubscriptionRepository.findOne({
        where: { student: { id: student.id }, status: SubscriptionStatus.ACTIVE },
        relations: ['plan'],
      });
      expect(newSub).toBeDefined();
      expect(newSub.plan.id).toBe(newPlan.id);
    });

    it('throws BadRequestException when student has an active paid subscription', async () => {
      const student = await makeStudent();
      const paidPlan = await makePaidPlan('student_monthly');

      await seedActivePaidSubForStudent(student, paidPlan);

      await expect(
        paymentService.initiatePayment(student.email, paidPlan.id, 'STUDENT'),
      ).rejects.toThrow(new BadRequestException('You already have an active subscription plan'));
    });
  });

  // ─── ORGANIZATION ────────────────────────────────────────────────────────────

  describe('initiatePayment — ORGANIZATION trial-to-paid upgrade', () => {
    it('expires the active trial and creates a new subscription when org upgrades from trial', async () => {
      const org = await makeOrg();
      const trialPlan = await makeFreePlan('school_trial');
      const newPlan = await makeFreePlan('school_trial_2');

      const trial = await seedActiveTrialForOrg(org, trialPlan);

      await paymentService.initiatePayment(org.email, newPlan.id, 'ORGANIZATION');

      const refreshedTrial = await orgSubscriptionRepository.findOne({
        where: { id: trial.id },
      });
      expect(refreshedTrial.status).toBe(SubscriptionStatus.EXPIRED);

      const newSub = await orgSubscriptionRepository.findOne({
        where: { organization: { id: org.id }, status: SubscriptionStatus.ACTIVE },
        relations: ['plan'],
      });
      expect(newSub).toBeDefined();
      expect(newSub.plan.id).toBe(newPlan.id);
    });

    it('throws BadRequestException when org has an active paid subscription', async () => {
      const org = await makeOrg();
      const paidPlan = await makePaidPlan('school_monthly');

      await seedActivePaidSubForOrg(org, paidPlan);

      await expect(
        paymentService.initiatePayment(org.email, paidPlan.id, 'ORGANIZATION'),
      ).rejects.toThrow(new BadRequestException('You already have an active subscription plan'));
    });
  });
});
