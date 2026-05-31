import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

const defaultPostgresDBConnection = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  autoLoadEntities: true,
  synchronize: false,
  migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
  url: configService.get('DATABASE_URL'),
  ssl: {
    rejectUnauthorized: false,
  },
});

const defaultRedisDBConnection = async (configService: ConfigService) => ({
  connection: {
    url: configService.get<string>('REDIS_URL'),
  },
});

export const databaseProviders = [
  TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: defaultPostgresDBConnection,
  }),
  BullModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: defaultRedisDBConnection,
  }),
];
