import { randomUUID } from 'crypto';
import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import type pino from 'pino';
import { Admin } from 'src/modules/auth/entities/admin.entity';
import { Organization } from 'src/modules/auth/entities/organization.entity';
import { GenpopOnlyGuard } from './guards/genpop-only.guard';
import { PINO_ROOT_LOGGER, PinoRootLoggerModule } from './pino-root-logger.module';
import { LoggingResolver } from './resolvers/logging.resolver';
import { LogArchiveConsumer } from './services/log-archive.consumer';
import { LogArchiveProducer } from './services/log-archive.producer';
import { LogLevelStore } from './services/log-level.store';
import { LogsHistoryService } from './services/logs-history.service';
import { ModuleLoggerRegistry } from './services/module-logger.registry';

@Global()
@Module({
  imports: [
    ConfigModule,
    PinoRootLoggerModule,
    TypeOrmModule.forFeature([Organization, Admin]),
    BullModule.registerQueue({ name: 'log-archive-queue' }),
    LoggerModule.forRootAsync({
      imports: [PinoRootLoggerModule],
      inject: [PINO_ROOT_LOGGER],
      useFactory: (rootLogger: pino.Logger) => ({
        pinoHttp: {
          logger: rootLogger,
          quietReqLogger: true,
          genReqId: (req: any, res: any) => {
            const existingId = req.id ?? req.headers['x-request-id'];
            if (existingId) return existingId;
            const id = randomUUID();
            res.setHeader('x-request-id', id);
            return id;
          },
        },
      }),
    }),
  ],
  providers: [
    ModuleLoggerRegistry,
    LogLevelStore,
    LogArchiveProducer,
    LogArchiveConsumer,
    LogsHistoryService,
    GenpopOnlyGuard,
    LoggingResolver,
  ],
  exports: [ModuleLoggerRegistry],
})
export class LoggingModule {}
