import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { createTestApp, EmailCapture } from '../helpers/app.helper';
import { truncateAll, seedGenpopOrg } from '../helpers/db.helper';
import { StudentService } from '../../src/modules/auth/services/student.service';

describe('Student OAuth Consent (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let emailCapture: EmailCapture;
  let jwtService: JwtService;
  let studentService: StudentService;

  const consentData = {
    email: 'google@example.com',
    firstName: 'Google',
    lastName: 'User',
  };

  beforeAll(async () => {
    ({ app, dataSource, emailCapture } = await createTestApp());
    jwtService = app.get<JwtService>(JwtService);
    studentService = app.get<StudentService>(StudentService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAll(dataSource);
    await seedGenpopOrg(dataSource);
    emailCapture.clear();
  });

  function validConsentToken() {
    return studentService.createConsentToken(consentData);
  }

  function wrongTypeToken() {
    return jwtService.sign({ ...consentData, type: 'refresh' });
  }

  // ─── Flow 1: GET /auth/consent — redirect passthrough ──────────────────────

  describe('GET /v1/students/auth/consent', () => {
    it('1.1 redirects to STUDENT_URL/oauth/consent?token=... (no PII in URL)', async () => {
      const token = validConsentToken();

      const res = await request(app.getHttpServer())
        .get(`/v1/students/auth/consent?token=${token}`)
        .redirects(0);

      expect(res.status).toBe(302);
      expect(res.headers.location).toMatch(/\/oauth\/consent\?token=.+/);
      expect(res.headers.location).not.toContain('email=');
      expect(res.headers.location).not.toContain('firstName=');
      expect(res.headers.location).not.toContain('lastName=');
    });

    it('1.2 returns 400 when token query param is missing', async () => {
      const res = await request(app.getHttpServer()).get(
        '/v1/students/auth/consent',
      );

      expect(res.status).toBe(400);
    });
  });

  // ─── Flow 2: GET /auth/consent/info ────────────────────────────────────────

  describe('GET /v1/students/auth/consent/info', () => {
    it('2.1 returns email, firstName and lastName from a valid consent token', async () => {
      const token = validConsentToken();

      const res = await request(app.getHttpServer()).get(
        `/v1/students/auth/consent/info?token=${token}`,
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        email: consentData.email,
        firstName: consentData.firstName,
        lastName: consentData.lastName,
      });
    });

    it('2.2 returns 401 for a malformed token', async () => {
      const res = await request(app.getHttpServer()).get(
        '/v1/students/auth/consent/info?token=not.a.real.token',
      );

      expect(res.status).toBe(401);
    });

    it('2.3 returns 401 for a token with the wrong type', async () => {
      const token = wrongTypeToken();

      const res = await request(app.getHttpServer()).get(
        `/v1/students/auth/consent/info?token=${token}`,
      );

      expect(res.status).toBe(401);
    });
  });

  // ─── Flow 3: POST /auth/consent ────────────────────────────────────────────

  describe('POST /v1/students/auth/consent', () => {
    it('3.1 returns failed redirectUrl when consent is "no"', async () => {
      const token = validConsentToken();

      const res = await request(app.getHttpServer())
        .post('/v1/students/auth/consent')
        .send({ consent: 'no', token });

      expect(res.status).toBe(201);
      expect(res.body.redirectUrl).toContain('/oauth/failed');
    });

    it('3.2 creates the Google user and returns validate-account URL when consent is "yes"', async () => {
      const token = validConsentToken();

      const res = await request(app.getHttpServer())
        .post('/v1/students/auth/consent')
        .send({ consent: 'yes', token });

      expect(res.status).toBe(201);
      expect(res.body.redirectUrl).toContain(
        `/validate-account?email=${consentData.email}`,
      );
      expect(
        emailCapture.getLast('sendAccountValidationEmail'),
      ).toMatchObject({ email: consentData.email });
    });

    it('3.3 returns 401 when the consent token is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/students/auth/consent')
        .send({ consent: 'yes', token: 'bad.token.value' });

      expect(res.status).toBe(401);
    });

    it('3.4 returns 401 when the token has the wrong type', async () => {
      const token = wrongTypeToken();

      const res = await request(app.getHttpServer())
        .post('/v1/students/auth/consent')
        .send({ consent: 'yes', token });

      expect(res.status).toBe(401);
    });

    it('3.5 returns 400 when token field is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/students/auth/consent')
        .send({ consent: 'yes' });

      expect(res.status).toBe(400);
    });

    it('3.6 returns 400 when consent field is missing', async () => {
      const token = validConsentToken();

      const res = await request(app.getHttpServer())
        .post('/v1/students/auth/consent')
        .send({ token });

      expect(res.status).toBe(400);
    });

    it('3.7 returns 400 when body is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/students/auth/consent')
        .send({});

      expect(res.status).toBe(400);
    });

    it('3.8 returns 400 when the same email tries to consent twice', async () => {
      const token = validConsentToken();

      await request(app.getHttpServer())
        .post('/v1/students/auth/consent')
        .send({ consent: 'yes', token });

      const secondToken = validConsentToken();
      const res = await request(app.getHttpServer())
        .post('/v1/students/auth/consent')
        .send({ consent: 'yes', token: secondToken });

      expect(res.status).toBe(400);
    });
  });
});
