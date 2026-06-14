import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Category } from '../../src/modules/inventory/entities/category.entity';
import { Organization } from '../../src/modules/auth/entities/organization.entity';
import { createTestApp, EmailCapture } from '../helpers/app.helper';
import { gql } from '../helpers/gql.helper';
import { truncateAll, seedGenpopOrg, seedTestCategory } from '../helpers/db.helper';

describe('Parent (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let emailCapture: EmailCapture;
  let genpopOrg: Organization;
  let testCategory: Category;

  beforeAll(async () => {
    ({ app, dataSource, emailCapture } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAll(dataSource);
    genpopOrg = await seedGenpopOrg(dataSource);
    testCategory = await seedTestCategory(dataSource, genpopOrg);
    emailCapture.clear();
  });

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const parentInput = {
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'parent@example.com',
    whatsapp_number: '+233501234567',
    password: 'ParentPass1!',
  };

  async function registerAndVerifyParent(
    input: typeof parentInput = parentInput,
  ): Promise<void> {
    await gql(
      app,
      `mutation($input: RegisterParentInput!) {
        registerParent(input: $input) { message }
      }`,
      { input },
    );
    const emailData = emailCapture.getLast('sendAccountValidationEmail') as { validationCode: string };
    await gql(
      app,
      `mutation($input: VerifyParentInput!) {
        verifyParentAccount(input: $input) { message }
      }`,
      { input: { email: input.email, code: emailData.validationCode } },
    );
  }

  async function loginParent(
    email: string,
    password: string,
  ): Promise<string> {
    const res = await gql(
      app,
      `mutation($input: LoginParentInput!) {
        loginParent(input: $input) { token refresh_token }
      }`,
      { input: { email, password } },
    );
    return (res.data.loginParent as { token: string }).token;
  }

  // ─── Flow 2: Parent Registration & Authentication ──────────────────────────

  describe('Flow 2: parent registration and authentication', () => {
    it('2.1 registers a parent', async () => {
      const res = await gql(
        app,
        `mutation($input: RegisterParentInput!) {
          registerParent(input: $input) { message }
        }`,
        { input: parentInput },
      );
      expect(res.errors).toBeUndefined();
      expect(res.data.registerParent).toMatchObject({ message: expect.any(String) });
    });

    it('2.2 verifies the parent account with the emailed code', async () => {
      await gql(
        app,
        `mutation($input: RegisterParentInput!) { registerParent(input: $input) { message } }`,
        { input: parentInput },
      );
      const emailData = emailCapture.getLast('sendAccountValidationEmail') as { validationCode: string };
      expect(emailData).toBeDefined();

      const res = await gql(
        app,
        `mutation($input: VerifyParentInput!) {
          verifyParentAccount(input: $input) { message }
        }`,
        { input: { email: parentInput.email, code: emailData.validationCode } },
      );
      expect(res.errors).toBeUndefined();
      expect((res.data.verifyParentAccount as { message: string }).message).toBeDefined();
    });

    it('2.3 logs in and returns tokens', async () => {
      await registerAndVerifyParent();

      const res = await gql(
        app,
        `mutation($input: LoginParentInput!) {
          loginParent(input: $input) { token refresh_token email }
        }`,
        { input: { email: parentInput.email, password: parentInput.password } },
      );
      expect(res.errors).toBeUndefined();
      const login = res.data.loginParent as { token: string; refresh_token: string; email: string };
      expect(login.token).toBeDefined();
      expect(login.refresh_token).toBeDefined();
      expect(login.email).toBe(parentInput.email);
    });

    it('2.4 refreshes the access token', async () => {
      await registerAndVerifyParent();
      const loginRes = await gql(
        app,
        `mutation($input: LoginParentInput!) { loginParent(input: $input) { token refresh_token } }`,
        { input: { email: parentInput.email, password: parentInput.password } },
      );
      const { refresh_token } = loginRes.data.loginParent as { token: string; refresh_token: string };

      const res = await gql(app, `
        mutation {
          refreshParentToken(refresh_token: "${refresh_token}") {
            access_token
          }
        }
      `);
      expect(res.errors).toBeUndefined();
      expect((res.data.refreshParentToken as { access_token: string }).access_token).toBeDefined();
    });

    it('2.5 resets parent password via email token', async () => {
      await registerAndVerifyParent();

      await gql(app, `mutation { requestParentPasswordReset(email: "${parentInput.email}") { message } }`);
      const resetEmailData = emailCapture.getLast('sendParentPasswordResetEmail') as { resetCode: string };
      expect(resetEmailData).toBeDefined();

      const newPassword = 'NewParentPass2!';
      const resetRes = await gql(app, `
        mutation {
          resetParentPassword(email: "${parentInput.email}", token: "${resetEmailData.resetCode}", password: "${newPassword}") {
            message
          }
        }
      `);
      expect(resetRes.errors).toBeUndefined();

      // Login with new password
      const loginRes = await gql(
        app,
        `mutation($input: LoginParentInput!) { loginParent(input: $input) { token } }`,
        { input: { email: parentInput.email, password: newPassword } },
      );
      expect(loginRes.errors).toBeUndefined();
      expect((loginRes.data.loginParent as { token: string }).token).toBeDefined();
    });

    it('2.6 changes parent password while authenticated', async () => {
      await registerAndVerifyParent();
      const token = await loginParent(parentInput.email, parentInput.password);
      const newPassword = 'ChangedParent3!';

      const res = await gql(app, `
        mutation {
          changeParentPassword(currentPassword: "${parentInput.password}", newPassword: "${newPassword}") {
            message
          }
        }
      `, undefined, token);
      expect(res.errors).toBeUndefined();

      // Old password no longer works
      const failLogin = await gql(
        app,
        `mutation($input: LoginParentInput!) { loginParent(input: $input) { token } }`,
        { input: { email: parentInput.email, password: parentInput.password } },
      );
      expect(failLogin.errors).toBeDefined();

      // New password works
      const newLogin = await gql(
        app,
        `mutation($input: LoginParentInput!) { loginParent(input: $input) { token } }`,
        { input: { email: parentInput.email, password: newPassword } },
      );
      expect(newLogin.errors).toBeUndefined();
    });
  });

  // ─── Flow 4: Parent Child Management ───────────────────────────────────────

  describe('Flow 4: parent child management', () => {
    const childInput = {
      full_name: 'Child One',
      class_level: 'JHS1',
      target_exam: '', // filled in beforeEach via testCategory.id
      school_name: 'Test School',
    };

    it('4.1 sets up parent account with one child', async () => {
      await registerAndVerifyParent();
      const token = await loginParent(parentInput.email, parentInput.password);

      const input = {
        children: [{ ...childInput, target_exam: testCategory.id }],
      };
      const res = await gql(
        app,
        `mutation($input: SetupParentAccountInput!) {
          setupParentAccount(input: $input) {
            full_name
            username
            pin
          }
        }`,
        { input },
        token,
      );
      expect(res.errors).toBeUndefined();
      const results = res.data.setupParentAccount as Array<{ full_name: string; username: string; pin: string }>;
      expect(results).toHaveLength(1);
      expect(results[0].full_name).toBe(childInput.full_name);
      expect(results[0].username).toBeDefined();
      expect(results[0].pin).toBeDefined();
    });

    it('4.2 lists children after setup', async () => {
      await registerAndVerifyParent();
      const token = await loginParent(parentInput.email, parentInput.password);
      await gql(
        app,
        `mutation($input: SetupParentAccountInput!) { setupParentAccount(input: $input) { username } }`,
        { input: { children: [{ ...childInput, target_exam: testCategory.id }] } },
        token,
      );

      const res = await gql(app, `
        query {
          listChildren {
            edges { node { id full_name username } }
            count
          }
        }
      `, undefined, token);
      expect(res.errors).toBeUndefined();
      const list = res.data.listChildren as { edges: Array<{ node: { id: string; full_name: string } }>; count: number };
      expect(list.count).toBe(1);
      expect(list.edges[0].node.full_name).toBe(childInput.full_name);
    });

    it('4.3 adds a second child', async () => {
      await registerAndVerifyParent();
      const token = await loginParent(parentInput.email, parentInput.password);
      await gql(
        app,
        `mutation($input: SetupParentAccountInput!) { setupParentAccount(input: $input) { username } }`,
        { input: { children: [{ ...childInput, target_exam: testCategory.id }] } },
        token,
      );

      const secondChildInput = {
        full_name: 'Child Two',
        class_level: 'SHS1',
        target_exam: testCategory.id,
      };
      const addRes = await gql(
        app,
        `mutation($input: AddChildInput!) { addChild(input: $input) { message } }`,
        { input: secondChildInput },
        token,
      );
      expect(addRes.errors).toBeUndefined();

      const listRes = await gql(app, `query { listChildren { count } }`, undefined, token);
      const list = listRes.data.listChildren as { count: number };
      expect(list.count).toBe(2);
    });

    it('4.4 resets a child PIN', async () => {
      await registerAndVerifyParent();
      const token = await loginParent(parentInput.email, parentInput.password);
      const setupRes = await gql(
        app,
        `mutation($input: SetupParentAccountInput!) { setupParentAccount(input: $input) { username pin } }`,
        { input: { children: [{ ...childInput, target_exam: testCategory.id }] } },
        token,
      );
      const { username, pin: oldPin } = (setupRes.data.setupParentAccount as Array<{ username: string; pin: string }>)[0];

      // Get child ID
      const listRes = await gql(app, `query { listChildren { edges { node { id } } } }`, undefined, token);
      const childId = ((listRes.data.listChildren as { edges: Array<{ node: { id: string } }> }).edges[0].node.id);

      const resetRes = await gql(app, `
        mutation {
          resetChildPin(childId: "${childId}") {
            message
            pin
          }
        }
      `, undefined, token);
      expect(resetRes.errors).toBeUndefined();
      const newPin = (resetRes.data.resetChildPin as { message: string; pin: string }).pin;
      expect(newPin).toBeDefined();
      expect(newPin).not.toBe(oldPin);

      // Old PIN no longer works for child login
      const verifyRes = await gql(app, `
        mutation($input: VerifyChildUsernameInput!) {
          verifyChildUsername(input: $input) { temp_token }
        }
      `, { input: { username } });
      const tempToken = (verifyRes.data.verifyChildUsername as { temp_token: string }).temp_token;

      const oldPinLogin = await gql(
        app,
        `mutation($input: LoginChildInput!) { loginChild(input: $input) { token } }`,
        { input: { temp_token: tempToken, pin: oldPin } },
      );
      expect(oldPinLogin.errors).toBeDefined();
    });

    it('4.5 verifies child username and logs in with new PIN', async () => {
      await registerAndVerifyParent();
      const token = await loginParent(parentInput.email, parentInput.password);
      const setupRes = await gql(
        app,
        `mutation($input: SetupParentAccountInput!) { setupParentAccount(input: $input) { username pin } }`,
        { input: { children: [{ ...childInput, target_exam: testCategory.id }] } },
        token,
      );
      const { username, pin } = (setupRes.data.setupParentAccount as Array<{ username: string; pin: string }>)[0];

      // Verify username (public endpoint)
      const verifyRes = await gql(app, `
        mutation($input: VerifyChildUsernameInput!) {
          verifyChildUsername(input: $input) { temp_token }
        }
      `, { input: { username } });
      expect(verifyRes.errors).toBeUndefined();
      const tempToken = (verifyRes.data.verifyChildUsername as { temp_token: string }).temp_token;
      expect(tempToken).toBeDefined();

      // Login as child
      const childLoginRes = await gql(
        app,
        `mutation($input: LoginChildInput!) { loginChild(input: $input) { token } }`,
        { input: { temp_token: tempToken, pin } },
      );
      expect(childLoginRes.errors).toBeUndefined();
      const childToken = (childLoginRes.data.loginChild as { token: string }).token;
      expect(childToken).toBeDefined();

      // Child can access student profile
      const profileRes = await gql(app, `query { studentProfile { name } }`, undefined, childToken);
      expect(profileRes.errors).toBeUndefined();
      expect((profileRes.data.studentProfile as { name: string }).name).toBe(childInput.full_name);
    });
  });

  // ─── Flow 5: Parent Account Deletion & Cancellation ───────────────────────

  describe('Flow 5: parent account deletion and cancellation', () => {
    it('5.1 requests deletion and cascades to children', async () => {
      await registerAndVerifyParent();
      const token = await loginParent(parentInput.email, parentInput.password);
      // Setup a child so the cascade is tested
      await gql(
        app,
        `mutation($input: SetupParentAccountInput!) { setupParentAccount(input: $input) { username } }`,
        { input: { children: [{ full_name: 'Child A', class_level: 'JHS1', target_exam: testCategory.id }] } },
        token,
      );

      const res = await gql(app, `
        mutation {
          requestParentAccountDeletion {
            message
            status
            deletionScheduledFor
          }
        }
      `, undefined, token);
      expect(res.errors).toBeUndefined();
      const deletion = res.data.requestParentAccountDeletion as { status: string; deletionScheduledFor: string };
      expect(deletion.status).toBe('PENDING_DELETION');
      expect(new Date(deletion.deletionScheduledFor).getTime()).toBeGreaterThan(Date.now());
    });

    it('5.2 login after deletion returns pending_deletion token', async () => {
      await registerAndVerifyParent();
      const activeToken = await loginParent(parentInput.email, parentInput.password);
      await gql(app, `mutation { requestParentAccountDeletion { status } }`, undefined, activeToken);

      const res = await gql(
        app,
        `mutation($input: LoginParentInput!) { loginParent(input: $input) { token account_status } }`,
        { input: { email: parentInput.email, password: parentInput.password } },
      );
      expect(res.errors).toBeUndefined();
      const login = res.data.loginParent as { token: string; account_status: string };
      expect(login.account_status).toBe('PENDING_DELETION');
      expect(login.token).toBeDefined();
    });

    it('5.3 verifies OTP and restores the parent account', async () => {
      await registerAndVerifyParent();
      const activeToken = await loginParent(parentInput.email, parentInput.password);
      await gql(app, `mutation { requestParentAccountDeletion { status } }`, undefined, activeToken);
      emailCapture.clear();

      // Login to get pending deletion token (triggers OTP)
      const loginRes = await gql(
        app,
        `mutation($input: LoginParentInput!) { loginParent(input: $input) { token } }`,
        { input: { email: parentInput.email, password: parentInput.password } },
      );
      const pendingToken = (loginRes.data.loginParent as { token: string }).token;

      const otpData = emailCapture.getLast('sendCancellationOtpEmail') as { otp: string };
      expect(otpData).toBeDefined();

      // Verify OTP
      const verifyRes = await gql(app, `
        mutation {
          verifyCancellationOtp(otp: "${otpData.otp}") {
            message
          }
        }
      `, undefined, pendingToken);
      expect(verifyRes.errors).toBeUndefined();

      // Cancel deletion
      const cancelRes = await gql(app, `
        mutation {
          cancelParentAccountDeletion {
            token
            account_status
          }
        }
      `, undefined, pendingToken);
      expect(cancelRes.errors).toBeUndefined();
      const restored = cancelRes.data.cancelParentAccountDeletion as { token: string; account_status: string };
      expect(restored.token).toBeDefined();
      expect(restored.account_status).toBe('ACTIVE');

      // Normal login works again
      const finalLogin = await gql(
        app,
        `mutation($input: LoginParentInput!) { loginParent(input: $input) { token } }`,
        { input: { email: parentInput.email, password: parentInput.password } },
      );
      expect(finalLogin.errors).toBeUndefined();
      expect((finalLogin.data.loginParent as { token: string }).token).toBeDefined();
    });
  });
});
