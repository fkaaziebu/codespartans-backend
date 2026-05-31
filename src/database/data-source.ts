import * as dotenv from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';

const stage = process.env.STAGE || 'development';
dotenv.config({ path: join(process.cwd(), `.env.${stage}.local`) });

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
  synchronize: false,
});
