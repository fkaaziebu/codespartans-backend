import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import {
  Cart,
  Checkout,
  Child,
  entities,
  Organization,
  Parent,
  Student,
  StudentSubscription,
  SubscriptionPlan,
  Test as TestEntity,
} from '../../../database/entities';
import { HashHelper } from '../../../helpers';
import { SubscriptionStatus } from '../../demo/entities/organization-subscription.entity';
import { TestModeType, TestStatusType } from '../../simulation/entities/test.entity';
import { ClassLevel } from '../../parent/entities/child.entity';
import { Gender } from '../../parent/entities/parent.entity';
import { PlanInterval } from '../../demo/entities/subscription-plan.entity';
import { AccountDeletionProducer } from './account-deletion.producer';
import { AccountDeletionService } from './account-deletion.service';
import { EmailProducer } from './email.producer';

const GENPOP_EMAIL = 'genpop@codespartans.com';

describe('AccountDeletionService', () => {
  let module: TestingModule;
  let connection: Connection;
  let accountDeletionService: AccountDeletionService;

  let studentRepository: Repository<Student>;
  let parentRepository: Repository<Parent>;
  let childRepository: Repository<Child>;
  let cartRepository: Repository<Cart>;
  let checkoutRepository: Repository<Checkout>;
  let testRepository: Repository<TestEntity>;
  let organizationRepository: Repository<Organization>;
  let studentSubscriptionRepository: Repository<StudentSubscription>;
  let subscriptionPlanRepository: Repository<SubscriptionPlan>;

  const mockAccountDeletionProducer = {
    scheduleStudentPurge: jest.fn().mockResolvedValue('mock-job-student'),
    scheduleParentPurge: jest.fn().mockResolvedValue('mock-job-parent'),
    cancelJob: jest.fn().mockResolvedValue(undefined),
  };

  const mockEmailProducer = {
    sendAccountDeletionNotice: jest.fn().mockResolvedValue(undefined),
    sendAccountRestoredNotice: jest.fn().mockResolvedValue(undefined),
    sendAccountPurgedConfirmation: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test.local' }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            url: configService.get<string>('DATABASE_URL'),
            entities,
            synchronize: true,
          }),
          inject: [ConfigService],
        }),
        TypeOrmModule.forFeature(entities),
      ],
      providers: [
        AccountDeletionService,
        { provide: AccountDeletionProducer, useValue: mockAccountDeletionProducer },
        { provide: EmailProducer, useValue: mockEmailProducer },
      ],
    }).compile();

    connection = module.get<Connection>(Connection);
    accountDeletionService = module.get<AccountDeletionService>(AccountDeletionService);
    studentRepository = module.get<Repository<Student>>(getRepositoryToken(Student));
    parentRepository = module.get<Repository<Parent>>(getRepositoryToken(Parent));
    childRepository = module.get<Repository<Child>>(getRepositoryToken(Child));
    cartRepository = module.get<Repository<Cart>>(getRepositoryToken(Cart));
    checkoutRepository = module.get<Repository<Checkout>>(getRepositoryToken(Checkout));
    testRepository = module.get<Repository<TestEntity>>(getRepositoryToken(TestEntity));
    organizationRepository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    studentSubscriptionRepository = module.get<Repository<StudentSubscription>>(getRepositoryToken(StudentSubscription));
    subscriptionPlanRepository = module.get<Repository<SubscriptionPlan>>(getRepositoryToken(SubscriptionPlan));
  });

  beforeEach(async () => {
    for (const entity of connection.entityMetadatas) {
      const repo = connection.getRepository(entity.name);
      await repo.query(`TRUNCATE "${entity.tableName}" CASCADE;`);
    }
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await connection.close();
    await module.close();
  });

  // ─── helpers ──────────────────────────────────────────────────────────────────

  const createStudent = async (email = 'student@test.com') => {
    const org = new Organization();
    org.name = 'General Population';
    org.email = GENPOP_EMAIL;
    org.password = await HashHelper.encrypt('password');
    const savedOrg = await organizationRepository.save(org);

    const cart = await cartRepository.save(new Cart());

    const student = new Student();
    student.name = 'Test Student';
    student.email = email;
    student.password = await HashHelper.encrypt('password');
    student.is_account_validated = true;
    student.cart = cart;
    student.organizations = [savedOrg];
    return studentRepository.save(student);
  };

  const createParent = async () => {
    const parent = new Parent();
    parent.first_name = 'Jane';
    parent.last_name = 'Doe';
    parent.email = 'parent@test.com';
    parent.whatsapp_number = '+233501234567';
    parent.gender = Gender.Female;
    parent.password = await HashHelper.encrypt('password');
    parent.is_account_validated = true;
    return parentRepository.save(parent);
  };

  const createChild = async (parent: Parent, student: Student, suffix = '') => {
    const child = new Child();
    child.full_name = 'Alice Child';
    child.class_level = ClassLevel.JHS1;
    child.target_exam = '00000000-0000-0000-0000-000000000001';
    child.username = `alice_child${suffix}`;
    child.pin = await HashHelper.encrypt('1234');
    child.parent = parent;
    child.student = student;
    return childRepository.save(child);
  };

  const createPlan = async () => {
    const plan = new SubscriptionPlan();
    plan.plan_key = 'test-plan';
    plan.name = 'Test Plan';
    plan.price = 10;
    plan.duration_days = 30;
    plan.interval = PlanInterval.MONTHLY;
    plan.features = [];
    plan.is_active = true;
    return subscriptionPlanRepository.save(plan);
  };

  // ─── requestStudentAccountDeletion ────────────────────────────────────────────

  describe('requestStudentAccountDeletion', () => {
    it('marks student as deactivated and schedules purge job', async () => {
      const student = await createStudent();

      const result = await accountDeletionService.requestStudentAccountDeletion(student.id);

      expect(result.message).toContain('90 days');

      const updated = await studentRepository.findOne({ where: { id: student.id } });
      expect(updated.is_deactivated).toBe(true);
      expect(updated.deactivated_at).toBeDefined();
      expect(updated.deletion_job_id).toBe('mock-job-student');

      expect(mockAccountDeletionProducer.scheduleStudentPurge).toHaveBeenCalledWith(student.id);
    });

    it('sends account deletion notice email', async () => {
      const student = await createStudent();

      await accountDeletionService.requestStudentAccountDeletion(student.id);

      expect(mockEmailProducer.sendAccountDeletionNotice).toHaveBeenCalledWith(
        expect.objectContaining({ email: student.email, name: student.name }),
      );
    });

    it('throws ForbiddenException if student is linked to a Child', async () => {
      const parent = await createParent();
      const student = await createStudent();
      await createChild(parent, student);

      await expect(
        accountDeletionService.requestStudentAccountDeletion(student.id),
      ).rejects.toThrow(
        new ForbiddenException('Child accounts can only be deleted by a parent.'),
      );
    });

    it('throws BadRequestException if already deactivated', async () => {
      const student = await createStudent();
      await studentRepository.update(student.id, {
        is_deactivated: true,
        deactivated_at: new Date(),
      });

      await expect(
        accountDeletionService.requestStudentAccountDeletion(student.id),
      ).rejects.toThrow(new BadRequestException('Account deletion already requested'));
    });

    it('throws NotFoundException if student does not exist', async () => {
      await expect(
        accountDeletionService.requestStudentAccountDeletion('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(new NotFoundException('Student not found'));
    });
  });

  // ─── requestParentAccountDeletion ─────────────────────────────────────────────

  describe('requestParentAccountDeletion', () => {
    it('marks parent as deactivated and schedules purge job', async () => {
      const parent = await createParent();

      const result = await accountDeletionService.requestParentAccountDeletion(parent.id);

      expect(result.message).toContain('90 days');

      const updated = await parentRepository.findOne({ where: { id: parent.id } });
      expect(updated.is_deactivated).toBe(true);
      expect(updated.deactivated_at).toBeDefined();
      expect(updated.deletion_job_id).toBe('mock-job-parent');

      expect(mockAccountDeletionProducer.scheduleParentPurge).toHaveBeenCalledWith(parent.id);
    });

    it('sends deletion notice email for parent', async () => {
      const parent = await createParent();

      await accountDeletionService.requestParentAccountDeletion(parent.id);

      expect(mockEmailProducer.sendAccountDeletionNotice).toHaveBeenCalledWith(
        expect.objectContaining({
          email: parent.email,
          name: `${parent.first_name} ${parent.last_name}`,
        }),
      );
    });

    it('also deactivates linked children student accounts', async () => {
      const parent = await createParent();
      const student = await createStudent();
      await createChild(parent, student);

      await accountDeletionService.requestParentAccountDeletion(parent.id);

      const updatedStudent = await studentRepository.findOne({ where: { id: student.id } });
      expect(updatedStudent.is_deactivated).toBe(true);
      expect(mockAccountDeletionProducer.scheduleStudentPurge).toHaveBeenCalledWith(student.id);
    });

    it('throws BadRequestException if parent already deactivated', async () => {
      const parent = await createParent();
      await parentRepository.update(parent.id, {
        is_deactivated: true,
        deactivated_at: new Date(),
      });

      await expect(
        accountDeletionService.requestParentAccountDeletion(parent.id),
      ).rejects.toThrow(new BadRequestException('Account deletion already requested'));
    });

    it('throws NotFoundException if parent does not exist', async () => {
      await expect(
        accountDeletionService.requestParentAccountDeletion('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(new NotFoundException('Parent not found'));
    });
  });

  // ─── deleteChild ──────────────────────────────────────────────────────────────

  describe('deleteChild', () => {
    it('initiates deletion of child student and nullifies child.student', async () => {
      const parent = await createParent();
      const student = await createStudent();
      const child = await createChild(parent, student);

      const result = await accountDeletionService.deleteChild(parent.email, child.id);

      expect(result.message).toContain('deletion requested');

      const updatedStudent = await studentRepository.findOne({ where: { id: student.id } });
      expect(updatedStudent.is_deactivated).toBe(true);

      const updatedChild = await childRepository.findOne({
        where: { id: child.id },
        relations: ['student'],
      });
      expect(updatedChild.student).toBeNull();
    });

    it('throws NotFoundException if child does not exist', async () => {
      await expect(
        accountDeletionService.deleteChild('parent@test.com', '00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(new NotFoundException('Child not found'));
    });

    it('throws ForbiddenException if requesting parent email does not match', async () => {
      const parent = await createParent();
      const student = await createStudent();
      const child = await createChild(parent, student);

      await expect(
        accountDeletionService.deleteChild('wrongparent@test.com', child.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── restoreStudent ───────────────────────────────────────────────────────────

  describe('restoreStudent', () => {
    it('clears deactivation fields, cancels the queued job, and sends restored email', async () => {
      const student = await createStudent();
      await studentRepository.update(student.id, {
        is_deactivated: true,
        deactivated_at: new Date(),
        deletion_job_id: 'job-abc',
      });
      const deactivated = await studentRepository.findOne({ where: { id: student.id } });

      await accountDeletionService.restoreStudent(deactivated);

      const restored = await studentRepository.findOne({ where: { id: student.id } });
      expect(restored.is_deactivated).toBe(false);
      expect(restored.deactivated_at).toBeNull();
      expect(restored.deletion_job_id).toBeNull();

      expect(mockAccountDeletionProducer.cancelJob).toHaveBeenCalledWith('job-abc');
      expect(mockEmailProducer.sendAccountRestoredNotice).toHaveBeenCalledWith(
        expect.objectContaining({ email: student.email, name: student.name }),
      );
    });
  });

  // ─── permanentlyPurgeStudent ──────────────────────────────────────────────────

  describe('permanentlyPurgeStudent', () => {
    it('deletes the student row and associated cart and checkouts', async () => {
      const student = await createStudent();
      await studentRepository.update(student.id, { is_deactivated: true });
      const cart = await cartRepository.findOne({ where: { student: { id: student.id } } });

      const checkout = await checkoutRepository.save(
        checkoutRepository.create({ student }),
      );

      await accountDeletionService.permanentlyPurgeStudent(student.id);

      expect(await studentRepository.findOne({ where: { id: student.id } })).toBeNull();
      if (cart) {
        expect(await cartRepository.findOne({ where: { id: cart.id } })).toBeNull();
      }
      expect(await checkoutRepository.findOne({ where: { id: checkout.id } })).toBeNull();
    });

    it('anonymises academic test records by nullifying student FK', async () => {
      const student = await createStudent();
      await studentRepository.update(student.id, { is_deactivated: true });

      const test = testRepository.create({
        status: TestStatusType.ENDED,
        mode: TestModeType.PROCTURED,
        student,
      });
      const savedTest = await testRepository.save(test);

      await accountDeletionService.permanentlyPurgeStudent(student.id);

      const survivingTest = await testRepository.findOne({
        where: { id: savedTest.id },
        relations: ['student'],
      });
      expect(survivingTest).toBeDefined();
      expect(survivingTest.student).toBeNull();
    });

    it('preserves financial subscription records with null student FK', async () => {
      const student = await createStudent();
      await studentRepository.update(student.id, { is_deactivated: true });
      const plan = await createPlan();

      const sub = studentSubscriptionRepository.create({
        student,
        plan,
        status: SubscriptionStatus.ACTIVE,
        started_at: new Date(),
        expires_at: new Date(Date.now() + 86400_000),
        paystack_reference: 'ref_test_123',
      });
      const savedSub = await studentSubscriptionRepository.save(sub);

      await accountDeletionService.permanentlyPurgeStudent(student.id);

      const survivingSub = await studentSubscriptionRepository.findOne({
        where: { id: savedSub.id },
      });
      expect(survivingSub).toBeDefined();
      expect(survivingSub.paystack_reference).toBe('ref_test_123');
    });

    it('deletes a linked Child record to avoid FK constraint violation', async () => {
      const parent = await createParent();
      const student = await createStudent();
      const child = await createChild(parent, student);
      await studentRepository.update(student.id, { is_deactivated: true });

      await accountDeletionService.permanentlyPurgeStudent(student.id);

      expect(await studentRepository.findOne({ where: { id: student.id } })).toBeNull();
      expect(await childRepository.findOne({ where: { id: child.id } })).toBeNull();
    });

    it('sends purge confirmation email before deleting the row', async () => {
      const student = await createStudent();
      await studentRepository.update(student.id, { is_deactivated: true });

      await accountDeletionService.permanentlyPurgeStudent(student.id);

      expect(mockEmailProducer.sendAccountPurgedConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({ email: student.email, name: student.name }),
      );
    });

    it('is a no-op if student is not found', async () => {
      await expect(
        accountDeletionService.permanentlyPurgeStudent('00000000-0000-0000-0000-000000000000'),
      ).resolves.not.toThrow();
      expect(mockEmailProducer.sendAccountPurgedConfirmation).not.toHaveBeenCalled();
    });

    it('is a no-op if student is not deactivated (idempotency guard)', async () => {
      const student = await createStudent();

      await accountDeletionService.permanentlyPurgeStudent(student.id);

      expect(await studentRepository.findOne({ where: { id: student.id } })).toBeDefined();
      expect(mockEmailProducer.sendAccountPurgedConfirmation).not.toHaveBeenCalled();
    });
  });

  // ─── permanentlyPurgeParent ───────────────────────────────────────────────────

  describe('permanentlyPurgeParent', () => {
    it('purges the parent, all children, and their linked students', async () => {
      const parent = await createParent();
      const student = await createStudent();
      await studentRepository.update(student.id, { is_deactivated: true });
      const child = await createChild(parent, student);

      await accountDeletionService.permanentlyPurgeParent(parent.id);

      expect(await parentRepository.findOne({ where: { id: parent.id } })).toBeNull();
      expect(await childRepository.findOne({ where: { id: child.id } })).toBeNull();
      expect(await studentRepository.findOne({ where: { id: student.id } })).toBeNull();
    });

    it('is a no-op if parent is not found', async () => {
      await expect(
        accountDeletionService.permanentlyPurgeParent('00000000-0000-0000-0000-000000000000'),
      ).resolves.not.toThrow();
    });
  });
});
