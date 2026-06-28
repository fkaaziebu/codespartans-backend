// Pre-conditions: PostgreSQL test DB and Redis must be running.
// .env.test.local is loaded by test/setup.ts (jest setupFiles) before this runs.
import { ValidationPipe } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { EmailProducer } from '../../src/modules/auth/services/email.producer';
import { SignupProducer } from '../../src/modules/auth/services/signup.producer';
import { AccountDeletionProducer } from '../../src/modules/auth/services/account-deletion.producer';
import { SetupDbService } from '../../src/setup-db-2.service';
import { SemanticCacheService } from '../../src/modules/simulation/services/semantic-cache.service';
import { GqlThrottlerGuard } from 'src/helpers/guards';
import { ThrottlerGuard } from '@nestjs/throttler';

export interface EmailCall {
  method: string;
  data: Record<string, unknown>;
}

export class EmailCapture {
  private calls: EmailCall[] = [];

  record(method: string, data: Record<string, unknown>) {
    this.calls.push({ method, data });
  }

  getLast(method: string): Record<string, unknown> | undefined {
    return [...this.calls].reverse().find((c) => c.method === method)?.data;
  }

  clear() {
    this.calls = [];
  }
}

export interface TestApp {
  app: INestApplication;
  dataSource: DataSource;
  emailCapture: EmailCapture;
}

export async function createTestApp(): Promise<TestApp> {
  const emailCapture = new EmailCapture();

  const mockEmailProducer = {
    sendAccountValidationEmail: jest.fn().mockImplementation((data) => {
      emailCapture.record('sendAccountValidationEmail', data);
      return Promise.resolve();
    }),
    sendPasswordResetEmail: jest.fn().mockImplementation((data) => {
      emailCapture.record('sendPasswordResetEmail', data);
      return Promise.resolve();
    }),
    sendParentPasswordResetEmail: jest.fn().mockImplementation((data) => {
      emailCapture.record('sendParentPasswordResetEmail', data);
      return Promise.resolve();
    }),
    sendCancellationOtpEmail: jest.fn().mockImplementation((data) => {
      emailCapture.record('sendCancellationOtpEmail', data);
      return Promise.resolve();
    }),
    sendAccountDeletionNotice: jest.fn().mockResolvedValue(undefined),
    sendAccountRestoredNotice: jest.fn().mockResolvedValue(undefined),
    sendChildDeletionNotice: jest.fn().mockResolvedValue(undefined),
    sendAccountPurgedConfirmation: jest.fn().mockResolvedValue(undefined),
    sendDemoInvitationEmail: jest.fn().mockResolvedValue(undefined),
    sendDemoAdminNotificationEmail: jest.fn().mockResolvedValue(undefined),
    sendParentDemoInvitationEmail: jest.fn().mockResolvedValue(undefined),
    sendStudentDemoInvitationEmail: jest.fn().mockResolvedValue(undefined),
    sendLeadAdminNotificationEmail: jest.fn().mockResolvedValue(undefined),
    sendParentAccountAlreadyExistsEmail: jest.fn().mockResolvedValue(undefined),
    sendPurgeFailureAlert: jest.fn().mockResolvedValue(undefined),
    sendChildPinResetRequestEmail: jest.fn().mockImplementation((data) => {
      emailCapture.record('sendChildPinResetRequestEmail', data);
      return Promise.resolve();
    }),
  };

  const mockSignupProducer = {
    enqueueFreeTrial: jest.fn().mockResolvedValue(undefined),
  };

  const mockAccountDeletionProducer = {
    scheduleStudentPurge: jest.fn().mockResolvedValue('mock-student-job'),
    scheduleParentPurge: jest.fn().mockResolvedValue('mock-parent-job'),
    cancelJob: jest.fn().mockResolvedValue(undefined),
  };

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(SetupDbService)
    .useValue({ onModuleInit: jest.fn().mockResolvedValue(undefined) })
    .overrideProvider(EmailProducer)
    .useValue(mockEmailProducer)
    .overrideProvider(SignupProducer)
    .useValue(mockSignupProducer)
    .overrideProvider(AccountDeletionProducer)
    .useValue(mockAccountDeletionProducer)
    .overrideProvider(SemanticCacheService)
    .useValue({ findSimilar: jest.fn().mockResolvedValue(null), store: jest.fn().mockResolvedValue(undefined) })
    .overrideGuard(GqlThrottlerGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.init();

  const dataSource = moduleFixture.get<DataSource>(DataSource);

  return { app, dataSource, emailCapture };
}
