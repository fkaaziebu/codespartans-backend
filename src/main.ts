import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { Client } from 'pg';
import { AppModule } from './app.module';

async function createDatabase(dbName: string) {
  const client = new Client({
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl:
      process.env.STAGE === 'prod' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database ${dbName} created successfully`);
  } catch (error) {
    if (error.code === '42P04') {
      console.log(`Database ${dbName} already exists`);
    } else {
      console.error(`Error creating database ${dbName}:`, error);
    }
  } finally {
    await client.end();
  }
}

async function bootstrap() {
  // Create main database
  await createDatabase(process.env.DB_NAME);

  // Create test database
  await createDatabase(process.env.DB_NAME_TEST);

  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  const isProd = process.env.STAGE === 'prod';

  app.use(
    helmet({
      contentSecurityPolicy: isProd,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT') || 4000;

  const corsOriginEnv = configService.get<string>('CORS_ORIGIN');
  const allowedOrigins = corsOriginEnv
    ? corsOriginEnv.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
