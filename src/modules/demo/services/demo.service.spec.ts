import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  entities,
  Organization,
  OrgSubscription,
  Parent,
  ParentDemoRequest,
  ParentSubscription,
  SchoolDemo,
  Student,
  StudentDemoRequest,
  StudentSubscription,
  SubscriptionPlan,
} from '../../../database/entities';
import {
  ApproximateStudents,
  DemoStatus,
  SchoolDemoRole,
} from '../entities/school-demo.entity';
import { SubscriptionStatus } from '../entities/organization-subscription.entity';
import { HashHelper } from '../../../helpers';
import { EmailProducer } from '../../auth/services/email.producer';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';
import { PaymentService } from './payment.service';
import { DemoService } from './demo.service';

const GENPOP_EMAIL = 'genpop@codespartans.com';

describe('DemoService', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let demoService: DemoService;

  let organizationRepository: Repository<Organization>;
  let schoolDemoRepository: Repository<SchoolDemo>;
  let parentDemoRepository: Repository<ParentDemoRequest>;
  let studentDemoRepository: Repository<StudentDemoRequest>;
  let studentRepository: Repository<Student>;
  let parentRepository: Repository<Parent>;
  let subscriptionPlanRepository: Repository<SubscriptionPlan>;

  const mockEmailProducer = {
    sendDemoInvitationEmail: jest.fn().mockResolvedValue(undefined),
    sendDemoAdminNotificationEmail: jest.fn().mockResolvedValue(undefined),
    sendParentDemoInvitationEmail: jest.fn().mockResolvedValue(undefined),
    sendStudentDemoInvitationEmail: jest.fn().mockResolvedValue(undefined),
    sendLeadAdminNotificationEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockPaymentService = {
    listPlans: jest.fn().mockResolvedValue([]),
    initiatePayment: jest.fn().mockResolvedValue({ authorization_url: 'http://pay.test', reference: 'ref123' }),
    getParentSubscription: jest.fn().mockResolvedValue(null),
    listParentSubscriptions: jest.fn().mockResolvedValue([]),
    getStudentSubscription: jest.fn().mockResolvedValue(null),
    listStudentSubscriptions: jest.fn().mockResolvedValue([]),
  };

  const mockLoggerRegistry = {
    getLogger: jest.fn().mockReturnValue({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
    }),
  };

  beforeAll(async () => {
    process.env.GENPOP_EMAIL = GENPOP_EMAIL;

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test.local',
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET') || 'test-secret',
            secretOrPrivateKey: configService.get('JWT_SECRET') || 'test-secret',
            signOptions: { expiresIn: '1h' },
          }),
          inject: [ConfigService],
        }),
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
      providers: [
        DemoService,
        { provide: EmailProducer, useValue: mockEmailProducer },
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: ModuleLoggerRegistry, useValue: mockLoggerRegistry },
        {
          provide: CACHE_MANAGER,
          useValue: { get: jest.fn().mockResolvedValue(null), set: jest.fn().mockResolvedValue(undefined), del: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    demoService = module.get<DemoService>(DemoService);
    organizationRepository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    schoolDemoRepository = module.get<Repository<SchoolDemo>>(getRepositoryToken(SchoolDemo));
    parentDemoRepository = module.get<Repository<ParentDemoRequest>>(getRepositoryToken(ParentDemoRequest));
    studentDemoRepository = module.get<Repository<StudentDemoRequest>>(getRepositoryToken(StudentDemoRequest));
    studentRepository = module.get<Repository<Student>>(getRepositoryToken(Student));
    parentRepository = module.get<Repository<Parent>>(getRepositoryToken(Parent));
    subscriptionPlanRepository = module.get<Repository<SubscriptionPlan>>(getRepositoryToken(SubscriptionPlan));
  });

  beforeEach(async () => {
    const entityMetadatas = dataSource.entityMetadatas;
    for (const entity of entityMetadatas) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE "${entity.tableName}" CASCADE;`);
    }
    jest.clearAllMocks();
  }, 30000);

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  // ─── helpers ────────────────────────────────────────────────────────────────

  const seedGenpopOrganization = async () => {
    const org = new Organization();
    org.name = 'General Population';
    org.email = GENPOP_EMAIL;
    org.password = await HashHelper.encrypt('password');
    return organizationRepository.save(org);
  };

  const schoolDemoInput = {
    name: 'Jane Admin',
    email: 'school@test.com',
    school_name: 'Test School',
    role: SchoolDemoRole.HEADMASTER_PRINCIPAL,
    approximate_students: ApproximateStudents.BETWEEN_50_AND_100,
    whatsapp_number: '+233501234567',
  };

  const parentDemoInput = {
    full_name: 'John Parent',
    email: 'parent@test.com',
    target_exams: ['BECE', 'WASSCE'],
    whatsapp_number: '+233501234567',
  };

  const studentDemoInput = {
    full_name: 'Alice Student',
    email: 'student@test.com',
    target_exam: 'BECE',
    whatsapp_number: '+233501234567',
  };

  // ─── bookSchoolFreeDemo ──────────────────────────────────────────────────────

  describe('bookSchoolFreeDemo', () => {
    it('creates a school demo record and sends invitation emails', async () => {
      const result = await demoService.bookSchoolFreeDemo(schoolDemoInput);

      expect(result.message).toContain('free demo has been booked');

      const demo = await schoolDemoRepository.findOne({
        where: { email: schoolDemoInput.email },
      });
      expect(demo).toBeDefined();
      expect(demo.status).toBe(DemoStatus.PENDING);
      expect(demo.demo_code).toBeDefined();
      expect(mockEmailProducer.sendDemoInvitationEmail).toHaveBeenCalled();
      expect(mockEmailProducer.sendDemoAdminNotificationEmail).toHaveBeenCalled();
    });

    it('throws ConflictException if a demo already exists for the email', async () => {
      await demoService.bookSchoolFreeDemo(schoolDemoInput);

      await expect(
        demoService.bookSchoolFreeDemo(schoolDemoInput),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── bookParentFreeDemo ──────────────────────────────────────────────────────

  describe('bookParentFreeDemo', () => {
    it('creates a parent demo record and sends invitation emails', async () => {
      const result = await demoService.bookParentFreeDemo(parentDemoInput);

      expect(result.message).toContain('free demo has been booked');

      const demo = await parentDemoRepository.findOne({
        where: { email: parentDemoInput.email },
      });
      expect(demo).toBeDefined();
      expect(demo.demo_code).toBeDefined();
      expect(mockEmailProducer.sendParentDemoInvitationEmail).toHaveBeenCalled();
      expect(mockEmailProducer.sendLeadAdminNotificationEmail).toHaveBeenCalled();
    });

    it('throws ConflictException if a demo already exists for the email', async () => {
      await demoService.bookParentFreeDemo(parentDemoInput);

      await expect(
        demoService.bookParentFreeDemo(parentDemoInput),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── bookStudentFreeDemo ─────────────────────────────────────────────────────

  describe('bookStudentFreeDemo', () => {
    it('creates a student demo record and sends invitation emails', async () => {
      const result = await demoService.bookStudentFreeDemo(studentDemoInput);

      expect(result.message).toContain('free demo has been booked');

      const demo = await studentDemoRepository.findOne({
        where: { email: studentDemoInput.email },
      });
      expect(demo).toBeDefined();
      expect(demo.demo_code).toBeDefined();
      expect(mockEmailProducer.sendStudentDemoInvitationEmail).toHaveBeenCalled();
      expect(mockEmailProducer.sendLeadAdminNotificationEmail).toHaveBeenCalled();
    });

    it('throws ConflictException if a demo already exists for the email', async () => {
      await demoService.bookStudentFreeDemo(studentDemoInput);

      await expect(
        demoService.bookStudentFreeDemo(studentDemoInput),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── activateSchoolDemo ──────────────────────────────────────────────────────

  describe('activateSchoolDemo', () => {
    it('activates the demo, creates an org, and returns an access token', async () => {
      await demoService.bookSchoolFreeDemo(schoolDemoInput);
      const demo = await schoolDemoRepository.findOne({
        where: { email: schoolDemoInput.email },
      });

      const result = await demoService.activateSchoolDemo({
        demo_code: demo.demo_code,
        password: 'secret123',
      });

      expect(result.access_token).toBeDefined();
      expect(result.email).toBe(schoolDemoInput.email);
      expect(result.expires_at).toBeDefined();

      const updatedDemo = await schoolDemoRepository.findOne({
        where: { demo_code: demo.demo_code },
      });
      expect(updatedDemo.status).toBe(DemoStatus.ACTIVE);

      const org = await organizationRepository.findOne({
        where: { email: schoolDemoInput.email },
      });
      expect(org).toBeDefined();
    });

    it('throws NotFoundException for an invalid demo code', async () => {
      await expect(
        demoService.activateSchoolDemo({
          demo_code: 'nonexistent-code',
          password: 'secret',
        }),
      ).rejects.toThrow(new NotFoundException('Invalid demo code.'));
    });

    it('throws BadRequestException if demo code has already been used', async () => {
      await demoService.bookSchoolFreeDemo(schoolDemoInput);
      const demo = await schoolDemoRepository.findOne({
        where: { email: schoolDemoInput.email },
      });

      await demoService.activateSchoolDemo({
        demo_code: demo.demo_code,
        password: 'secret123',
      });

      await expect(
        demoService.activateSchoolDemo({
          demo_code: demo.demo_code,
          password: 'secret123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException if an org already exists for the email', async () => {
      await demoService.bookSchoolFreeDemo(schoolDemoInput);
      const demo = await schoolDemoRepository.findOne({
        where: { email: schoolDemoInput.email },
      });

      // Seed an org with that email manually
      const org = new Organization();
      org.name = 'Existing';
      org.email = schoolDemoInput.email;
      org.password = await HashHelper.encrypt('password');
      await organizationRepository.save(org);

      await expect(
        demoService.activateSchoolDemo({
          demo_code: demo.demo_code,
          password: 'secret123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── activateStudentDemo ─────────────────────────────────────────────────────

  describe('activateStudentDemo', () => {
    it('activates demo, creates a student, and returns tokens', async () => {
      await seedGenpopOrganization();
      await demoService.bookStudentFreeDemo(studentDemoInput);
      const demo = await studentDemoRepository.findOne({
        where: { email: studentDemoInput.email },
      });

      const result = await demoService.activateStudentDemo({
        demo_code: demo.demo_code,
        password: 'secret123',
      });

      expect(result.token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
      expect(result.email).toBe(studentDemoInput.email);

      const updatedDemo = await studentDemoRepository.findOne({
        where: { demo_code: demo.demo_code },
      });
      expect(updatedDemo.status).toBe(DemoStatus.ACTIVE);

      const student = await studentRepository.findOne({
        where: { email: studentDemoInput.email },
      });
      expect(student).toBeDefined();
      expect(student.is_account_validated).toBe(true);
    });

    it('throws NotFoundException for an invalid demo code', async () => {
      await expect(
        demoService.activateStudentDemo({
          demo_code: 'nonexistent-code',
          password: 'secret',
        }),
      ).rejects.toThrow(new NotFoundException('Invalid demo code.'));
    });

    it('throws NotFoundException if GENPOP organization is not found', async () => {
      await demoService.bookStudentFreeDemo(studentDemoInput);
      const demo = await studentDemoRepository.findOne({
        where: { email: studentDemoInput.email },
      });

      await expect(
        demoService.activateStudentDemo({
          demo_code: demo.demo_code,
          password: 'secret123',
        }),
      ).rejects.toThrow(new NotFoundException('Genpop organization not found.'));
    });

    it('throws ConflictException if a student already exists for the email', async () => {
      const org = await seedGenpopOrganization();

      // Seed a student with the demo email directly
      const existingCart = new (await import('../../inventory/entities/cart.entity')).Cart();
      const cartRepo = dataSource.getRepository('Cart');
      await cartRepo.save(existingCart);

      const existingStudent = studentRepository.create({
        name: 'Pre-existing',
        email: studentDemoInput.email,
        password: await HashHelper.encrypt('password'),
        is_account_validated: true,
        organizations: [org],
        cart: existingCart,
      });
      await studentRepository.save(existingStudent);

      await demoService.bookStudentFreeDemo(studentDemoInput);
      const demo = await studentDemoRepository.findOne({
        where: { email: studentDemoInput.email },
      });

      await expect(
        demoService.activateStudentDemo({
          demo_code: demo.demo_code,
          password: 'secret123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── activateParentDemo ──────────────────────────────────────────────────────

  describe('activateParentDemo', () => {
    it('activates demo, creates a parent, and returns tokens', async () => {
      await demoService.bookParentFreeDemo(parentDemoInput);
      const demo = await parentDemoRepository.findOne({
        where: { email: parentDemoInput.email },
      });

      const result = await demoService.activateParentDemo({
        demo_code: demo.demo_code,
        password: 'secret123',
      });

      expect(result.token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
      expect(result.email).toBe(parentDemoInput.email);

      const updatedDemo = await parentDemoRepository.findOne({
        where: { demo_code: demo.demo_code },
      });
      expect(updatedDemo.status).toBe(DemoStatus.ACTIVE);

      const parent = await parentRepository.findOne({
        where: { email: parentDemoInput.email },
      });
      expect(parent).toBeDefined();
      expect(parent.is_account_validated).toBe(true);
    });

    it('throws NotFoundException for an invalid demo code', async () => {
      await expect(
        demoService.activateParentDemo({
          demo_code: 'nonexistent-code',
          password: 'secret',
        }),
      ).rejects.toThrow(new NotFoundException('Invalid demo code.'));
    });

    it('throws BadRequestException if demo code has already been used', async () => {
      await demoService.bookParentFreeDemo(parentDemoInput);
      const demo = await parentDemoRepository.findOne({
        where: { email: parentDemoInput.email },
      });

      await demoService.activateParentDemo({
        demo_code: demo.demo_code,
        password: 'secret123',
      });

      await expect(
        demoService.activateParentDemo({
          demo_code: demo.demo_code,
          password: 'secret123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException if a parent already exists for the email', async () => {
      await demoService.bookParentFreeDemo(parentDemoInput);
      const demo = await parentDemoRepository.findOne({
        where: { email: parentDemoInput.email },
      });

      const existingParent = new Parent();
      existingParent.first_name = 'Existing';
      existingParent.last_name = 'Parent';
      existingParent.email = parentDemoInput.email;
      existingParent.password = await HashHelper.encrypt('password');
      existingParent.whatsapp_number = '+1234567890';
      existingParent.is_account_validated = true;
      existingParent.is_setup_completed = false;
      await parentRepository.save(existingParent);

      await expect(
        demoService.activateParentDemo({
          demo_code: demo.demo_code,
          password: 'secret123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── listPlans ───────────────────────────────────────────────────────────────

  describe('listPlans', () => {
    it('delegates to PaymentService.listPlans and returns the result', async () => {
      const plans = [{ id: 'plan-1', name: 'Basic', price: 0 }] as SubscriptionPlan[];
      mockPaymentService.listPlans.mockResolvedValueOnce(plans);

      const result = await demoService.listPlans();

      expect(mockPaymentService.listPlans).toHaveBeenCalled();
      expect(result).toEqual(plans);
    });
  });

  // ─── delegation methods ──────────────────────────────────────────────────────

  describe('initiatePayment', () => {
    it('delegates to PaymentService.initiatePayment', async () => {
      const expected = { authorization_url: 'http://pay.test', reference: 'ref' };
      mockPaymentService.initiatePayment.mockResolvedValueOnce(expected);

      const result = await demoService.initiatePayment('user@test.com', 'plan-1', 'STUDENT');

      expect(mockPaymentService.initiatePayment).toHaveBeenCalledWith('user@test.com', 'plan-1', 'STUDENT', []);
      expect(result).toEqual(expected);
    });
  });

  describe('getMySubscription', () => {
    it('delegates to PaymentService.getParentSubscription', async () => {
      await demoService.getMySubscription('parent@test.com');
      expect(mockPaymentService.getParentSubscription).toHaveBeenCalledWith('parent@test.com');
    });
  });

  describe('getMyStudentSubscription', () => {
    it('delegates to PaymentService.getStudentSubscription', async () => {
      await demoService.getMyStudentSubscription('student@test.com');
      expect(mockPaymentService.getStudentSubscription).toHaveBeenCalledWith('student@test.com');
    });
  });
});
