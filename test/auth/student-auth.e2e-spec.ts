import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp, EmailCapture } from '../helpers/app.helper';
import { gql } from '../helpers/gql.helper';
import { truncateAll, seedGenpopOrg } from '../helpers/db.helper';

describe('Student Auth (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let emailCapture: EmailCapture;

  beforeAll(async () => {
    ({ app, dataSource, emailCapture } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAll(dataSource);
    await seedGenpopOrg(dataSource);
    emailCapture.clear();
  });

  // ─── Flow 1: Registration & Authentication ──────────────────────────────────

  describe('Flow 1: registration and authentication', () => {
    const email = 'student@example.com';
    const password = 'Password123!';
    const name = 'Test Student';
    let accessToken: string;
    let refreshToken: string;

    it('1.1 registers a student', async () => {
      const res = await gql(
        app,
        `
        mutation {
          registerStudent(name: "${name}", email: "${email}", password: "${password}") {
            message
          }
        }
      `,
      );
      expect(res.errors).toBeUndefined();
      expect(res.data.registerStudent).toMatchObject({
        message: expect.any(String),
      });
    });

    it('1.2 validates the account using the emailed code', async () => {
      await gql(
        app,
        `
        mutation { registerStudent(name: "${name}", email: "${email}", password: "${password}") { message } }
      `,
      );

      const emailData = emailCapture.getLast('sendAccountValidationEmail') as {
        validationCode: string;
      };
      expect(emailData).toBeDefined();
      const code = emailData.validationCode;

      const res = await gql(
        app,
        `
        mutation {
          completeStudentAccountValidation(email: "${email}", validation_code: "${code}") {
            message
          }
        }
      `,
      );
      expect(res.errors).toBeUndefined();
      expect(res.data.completeStudentAccountValidation).toMatchObject({
        message: expect.stringContaining('verified'),
      });
    });

    it('1.3 logs in and returns tokens', async () => {
      await gql(
        app,
        `mutation { registerStudent(name: "${name}", email: "${email}", password: "${password}") { message } }`,
      );
      const emailData = emailCapture.getLast('sendAccountValidationEmail') as {
        validationCode: string;
      };
      await gql(
        app,
        `mutation { completeStudentAccountValidation(email: "${email}", validation_code: "${emailData.validationCode}") { message } }`,
      );

      const res = await gql(
        app,
        `
        query {
          loginStudent(email: "${email}", password: "${password}") {
            token
            refresh_token
            name
            email
          }
        }
      `,
      );
      expect(res.errors).toBeUndefined();
      const login = res.data.loginStudent as {
        token: string;
        refresh_token: string;
        name: string;
        email: string;
      };
      expect(login.token).toBeDefined();
      expect(login.refresh_token).toBeDefined();
      expect(login.email).toBe(email);
      accessToken = login.token;
      refreshToken = login.refresh_token;
    });

    it('1.4 returns the student profile when authenticated', async () => {
      // Register + verify + login
      await gql(
        app,
        `mutation { registerStudent(name: "${name}", email: "${email}", password: "${password}") { message } }`,
      );
      const emailData = emailCapture.getLast('sendAccountValidationEmail') as {
        validationCode: string;
      };
      await gql(
        app,
        `mutation { completeStudentAccountValidation(email: "${email}", validation_code: "${emailData.validationCode}") { message } }`,
      );
      const loginRes = await gql(
        app,
        `query { loginStudent(email: "${email}", password: "${password}") { token } }`,
      );
      const token = (loginRes.data.loginStudent as { token: string }).token;

      const res = await gql(
        app,
        `
        query {
          studentProfile {
            name
            email
          }
        }
      `,
        undefined,
        token,
      );
      expect(res.errors).toBeUndefined();
      expect(res.data.studentProfile).toMatchObject({ name, email });
    });

    it('1.5 refreshes the access token', async () => {
      await gql(
        app,
        `mutation { registerStudent(name: "${name}", email: "${email}", password: "${password}") { message } }`,
      );
      const emailData = emailCapture.getLast('sendAccountValidationEmail') as {
        validationCode: string;
      };
      await gql(
        app,
        `mutation { completeStudentAccountValidation(email: "${email}", validation_code: "${emailData.validationCode}") { message } }`,
      );
      const loginRes = await gql(
        app,
        `query { loginStudent(email: "${email}", password: "${password}") { token refresh_token } }`,
      );
      const { refresh_token } = loginRes.data.loginStudent as {
        token: string;
        refresh_token: string;
      };

      const res = await gql(
        app,
        `
        mutation {
          refreshStudentToken(refresh_token: "${refresh_token}") {
            access_token
          }
        }
      `,
      );
      expect(res.errors).toBeUndefined();
      expect(
        (res.data.refreshStudentToken as { access_token: string }).access_token,
      ).toBeDefined();
    });

    it('1.6 resets the password via email token', async () => {
      const response = await gql(
        app,
        `mutation { registerStudent(name: "${name}", email: "${email}", password: "${password}") { message } }`,
      );

      const emailData = emailCapture.getLast('sendAccountValidationEmail') as {
        validationCode: string;
      };

      console.log('emailData:', response);

      await gql(
        app,
        `mutation { completeStudentAccountValidation(email: "${email}", validation_code: "${emailData.validationCode}") { message } }`,
      );

      // Request reset
      await gql(
        app,
        `mutation { requestStudentPasswordReset(email: "${email}") { message } }`,
      );
      const resetEmailData = emailCapture.getLast('sendPasswordResetEmail') as {
        resetCode: string;
      };
      expect(resetEmailData).toBeDefined();
      const resetCode = resetEmailData.resetCode;

      // Reset password
      const newPassword = 'NewPassword456!';
      const resetRes = await gql(
        app,
        `
        mutation {
          resetStudentPassword(email: "${email}", token: "${resetCode}", password: "${newPassword}") {
            message
          }
        }
      `,
      );
      expect(resetRes.errors).toBeUndefined();
      expect(
        (resetRes.data.resetStudentPassword as { message: string }).message,
      ).toContain('successful');

      // Login with new password succeeds
      const loginRes = await gql(
        app,
        `query { loginStudent(email: "${email}", password: "${newPassword}") { token } }`,
      );
      expect(loginRes.errors).toBeUndefined();
      expect(
        (loginRes.data.loginStudent as { token: string }).token,
      ).toBeDefined();
    });

    it('1.7 changes password while authenticated', async () => {
      const newPassword = 'Changed789!';
      await gql(
        app,
        `mutation { registerStudent(name: "${name}", email: "${email}", password: "${password}") { message } }`,
      );
      const emailData = emailCapture.getLast('sendAccountValidationEmail') as {
        validationCode: string;
      };
      await gql(
        app,
        `mutation { completeStudentAccountValidation(email: "${email}", validation_code: "${emailData.validationCode}") { message } }`,
      );
      const loginRes = await gql(
        app,
        `query { loginStudent(email: "${email}", password: "${password}") { token } }`,
      );
      const token = (loginRes.data.loginStudent as { token: string }).token;

      const res = await gql(
        app,
        `
        mutation {
          changePassword(currentPassword: "${password}", newPassword: "${newPassword}") {
            message
          }
        }
      `,
        undefined,
        token,
      );
      expect(res.errors).toBeUndefined();
      expect(
        (res.data.changePassword as { message: string }).message,
      ).toContain('changed');

      // Old password no longer works
      const failLogin = await gql(
        app,
        `query { loginStudent(email: "${email}", password: "${password}") { token } }`,
      );
      expect(failLogin.errors).toBeDefined();

      // New password works
      const newLogin = await gql(
        app,
        `query { loginStudent(email: "${email}", password: "${newPassword}") { token } }`,
      );
      expect(newLogin.errors).toBeUndefined();
    });
  });

  // ─── Flow 2: pw_changed token invalidation ─────────────────────────────────

  describe('Flow 2: pw_changed token invalidation', () => {
    const email = 'pw-invalidation@example.com';
    const password = 'Password123!';
    const name = 'Token Test Student';

    async function registerVerifyAndLogin(): Promise<string> {
      await gql(
        app,
        `mutation { registerStudent(name: "${name}", email: "${email}", password: "${password}") { message } }`,
      );
      const emailData = emailCapture.getLast('sendAccountValidationEmail') as {
        validationCode: string;
      };
      await gql(
        app,
        `mutation { completeStudentAccountValidation(email: "${email}", validation_code: "${emailData.validationCode}") { message } }`,
      );
      const loginRes = await gql(
        app,
        `query { loginStudent(email: "${email}", password: "${password}") { token } }`,
      );
      return (loginRes.data.loginStudent as { token: string }).token;
    }

    it('2.1 old token is rejected after changePassword, fresh login token works', async () => {
      const oldToken = await registerVerifyAndLogin();
      const newPassword = 'NewPass456!';

      // Wait for a new JWT second so oldToken.iat < pw_changed_seconds
      await new Promise((r) => setTimeout(r, 1100));

      await gql(
        app,
        `mutation { changePassword(currentPassword: "${password}", newPassword: "${newPassword}") { message } }`,
        undefined,
        oldToken,
      );

      // Old token must be rejected
      const oldTokenRes = await gql(
        app,
        `query { studentProfile { name } }`,
        undefined,
        oldToken,
      );
      expect(oldTokenRes.errors).toBeDefined();

      // Fresh login with new password returns a working token
      const freshLoginRes = await gql(
        app,
        `query { loginStudent(email: "${email}", password: "${newPassword}") { token } }`,
      );
      expect(freshLoginRes.errors).toBeUndefined();
      const freshToken = (freshLoginRes.data.loginStudent as { token: string })
        .token;

      const profileRes = await gql(
        app,
        `query { studentProfile { name } }`,
        undefined,
        freshToken,
      );
      expect(profileRes.errors).toBeUndefined();
      expect((profileRes.data.studentProfile as { name: string }).name).toBe(
        name,
      );
    });

    it('2.2 old token is rejected after resetStudentPassword, fresh login token works', async () => {
      const oldToken = await registerVerifyAndLogin();
      const newPassword = 'ResetPass789!';

      // Wait for a new JWT second so oldToken.iat < pw_changed_seconds
      await new Promise((r) => setTimeout(r, 1100));

      await gql(
        app,
        `mutation { requestStudentPasswordReset(email: "${email}") { message } }`,
      );
      const resetData = emailCapture.getLast('sendPasswordResetEmail') as {
        resetCode: string;
      };

      await gql(
        app,
        `mutation { resetStudentPassword(email: "${email}", token: "${resetData.resetCode}", password: "${newPassword}") { message } }`,
      );

      // Old token must be rejected
      const oldTokenRes = await gql(
        app,
        `query { studentProfile { name } }`,
        undefined,
        oldToken,
      );
      expect(oldTokenRes.errors).toBeDefined();

      // Fresh login with new password returns a working token
      const freshLoginRes = await gql(
        app,
        `query { loginStudent(email: "${email}", password: "${newPassword}") { token } }`,
      );
      expect(freshLoginRes.errors).toBeUndefined();
      const freshToken = (freshLoginRes.data.loginStudent as { token: string })
        .token;

      const profileRes = await gql(
        app,
        `query { studentProfile { name } }`,
        undefined,
        freshToken,
      );
      expect(profileRes.errors).toBeUndefined();
    });
  });

  // ─── Flow 3: Account Deletion & Cancellation ───────────────────────────────

  describe('Flow 3: account deletion and cancellation', () => {
    const email = 'deleteme@example.com';
    const password = 'Delete123!';
    const name = 'Deletion Student';

    async function registerVerifyLogin() {
      await gql(
        app,
        `mutation { registerStudent(name: "${name}", email: "${email}", password: "${password}") { message } }`,
      );
      const emailData = emailCapture.getLast('sendAccountValidationEmail') as {
        validationCode: string;
      };
      await gql(
        app,
        `mutation { completeStudentAccountValidation(email: "${email}", validation_code: "${emailData.validationCode}") { message } }`,
      );
      const loginRes = await gql(
        app,
        `query { loginStudent(email: "${email}", password: "${password}") { token refresh_token } }`,
      );
      return (
        loginRes.data.loginStudent as { token: string; refresh_token: string }
      ).token;
    }

    it('3.1 requests account deletion and schedules it 90 days out', async () => {
      const token = await registerVerifyLogin();

      const res = await gql(
        app,
        `
        mutation {
          requestStudentAccountDeletion {
            message
            status
            deletionScheduledFor
          }
        }
      `,
        undefined,
        token,
      );
      expect(res.errors).toBeUndefined();
      const deletion = res.data.requestStudentAccountDeletion as {
        message: string;
        status: string;
        deletionScheduledFor: string;
      };
      expect(deletion.status).toBe('PENDING_DELETION');
      expect(new Date(deletion.deletionScheduledFor).getTime()).toBeGreaterThan(
        Date.now(),
      );
    });

    it('3.2 login after deletion returns a pending_deletion token', async () => {
      const activeToken = await registerVerifyLogin();
      await gql(
        app,
        `mutation { requestStudentAccountDeletion { status } }`,
        undefined,
        activeToken,
      );

      const res = await gql(
        app,
        `
        query {
          loginStudent(email: "${email}", password: "${password}") {
            token
            account_status
          }
        }
      `,
      );
      expect(res.errors).toBeUndefined();
      const login = res.data.loginStudent as {
        token: string;
        account_status: string;
      };
      expect(login.account_status).toBe('PENDING_DELETION');
      expect(login.token).toBeDefined();
    });

    it('3.3 verifies cancellation OTP and restores the account', async () => {
      const activeToken = await registerVerifyLogin();
      await gql(
        app,
        `mutation { requestStudentAccountDeletion { status } }`,
        undefined,
        activeToken,
      );
      emailCapture.clear();

      // Login to get pending deletion token (also triggers OTP email)
      const loginRes = await gql(
        app,
        `query { loginStudent(email: "${email}", password: "${password}") { token account_status } }`,
      );
      const pendingToken = (loginRes.data.loginStudent as { token: string })
        .token;

      const otpData = emailCapture.getLast('sendCancellationOtpEmail') as {
        otp: string;
      };
      expect(otpData).toBeDefined();
      const otp = otpData.otp;

      // Verify OTP
      const verifyRes = await gql(
        app,
        `
        mutation {
          verifyCancellationOtp(otp: "${otp}") {
            message
          }
        }
      `,
        undefined,
        pendingToken,
      );
      expect(verifyRes.errors).toBeUndefined();

      // Cancel deletion
      const cancelRes = await gql(
        app,
        `
        mutation {
          cancelStudentAccountDeletion {
            token
            account_status
          }
        }
      `,
        undefined,
        pendingToken,
      );
      expect(cancelRes.errors).toBeUndefined();
      const restored = cancelRes.data.cancelStudentAccountDeletion as {
        token: string;
        account_status: string;
      };
      expect(restored.token).toBeDefined();
      expect(restored.account_status).toBe('ACTIVE');

      // Normal login works again
      const finalLogin = await gql(
        app,
        `query { loginStudent(email: "${email}", password: "${password}") { token } }`,
      );
      expect(finalLogin.errors).toBeUndefined();
      expect(
        (finalLogin.data.loginStudent as { token: string }).token,
      ).toBeDefined();
    });
  });
});
