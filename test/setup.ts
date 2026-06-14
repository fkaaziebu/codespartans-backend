// Runs before each Jest worker (setupFiles). Loads .env.test.local then applies
// fallback values for every var required by configValidationSchema. This ensures
// the AppModule's Joi validation passes in both local and CI environments.
// Services that use these credentials (email, Paystack, Anthropic) are mocked in
// e2e tests, so placeholder values are safe.
const fs = require('fs');
const path = require('path');

// 1. Read .env.test.local — only sets vars not already in process.env.
const envPath = path.resolve(process.cwd(), '.env.test.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8') as string;
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

// 2. Apply defaults for any var that is still missing or empty (e.g. exported as
//    an empty string from the developer's shell). These values satisfy Joi validation
//    and are safe because the services that use them are mocked in e2e tests.
const defaults: Record<string, string> = {
  PORT: '4002',
  JWT_SECRET: 'test-jwt-secret',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/codespartans-test-db?sslmode=disable',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'codespartans-test-db',
  DB_NAME_TEST: 'codespartans-test-db',
  GENPOP_EMAIL: 'genpop@codespartans.com',
  EMAIL_FROM: 'noreply@ci.test',
  GMAIL_APP_PASSWORD: 'ci-fake-gmail-pass',
  GMAIL_USER: 'ci@gmail.test',
  EMAIL_HOST: 'smtp.gmail.com',
  STUDENT_URL: 'http://localhost:3000',
  PARENT_URL: 'http://localhost:3001',
  PAYSTACK_SECRET_KEY: 'sk_test_fake',
  ANTHROPIC_API_KEY: 'sk-ant-fake',
  PAYMENT_RETENTION_YEARS: '7',
  ADMIN_EMAIL: 'admin@example.com',
  REDIS_URL: 'redis://localhost:6379',
  ACCOUNT_DELETION_GRACE_DAYS: '90',
};

for (const [key, value] of Object.entries(defaults)) {
  // !process.env[key] catches both undefined and empty-string cases.
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
