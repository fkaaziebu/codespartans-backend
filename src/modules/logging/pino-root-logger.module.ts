import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import pino from 'pino';
// pino-roll ships no `.default` interop shim and no type declarations, so a
// default `import` would silently resolve to `undefined` at runtime under
// this project's tsconfig (no `esModuleInterop`) — use `require()` instead.
import buildRollingFileStream = require('pino-roll');
import pretty from 'pino-pretty';

export const PINO_ROOT_LOGGER = 'PINO_ROOT_LOGGER';

// SEC-001: never let email/name/PIN/password leak into log output, even at debug.
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.body.email',
  'req.body.name',
  'req.body.pin',
  '*.email',
  '*.pin',
  '*.password',
];

// One canonical pino instance for the whole app — shared by nestjs-pino's
// request logging (LoggingModule) and by ModuleLoggerRegistry's per-module
// child loggers — so both write to the same rotating file and honor the
// same redaction/level-label config. A plain (non-dynamic) module so Nest
// treats every import of it as the same singleton instance.
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PINO_ROOT_LOGGER,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const isProd = configService.get<string>('STAGE') === 'prod';
        const logDir = configService.get<string>('LOG_DIR') || 'logs';
        const level = configService.get<string>('LOG_LEVEL') || 'info';

        const fileStream = await buildRollingFileStream({
          file: join(logDir, 'app'),
          frequency: 'daily',
          mkdir: true,
        });

        const streams = [{ stream: fileStream, level }];
        if (!isProd) {
          streams.push({
            stream: pretty({ colorize: true, singleLine: true }),
            level,
          });
        }

        return pino(
          {
            level,
            redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
            formatters: { level: (label: string) => ({ level: label }) },
            timestamp: pino.stdTimeFunctions.isoTime,
          },
          pino.multistream(streams),
        );
      },
    },
  ],
  exports: [PINO_ROOT_LOGGER],
})
export class PinoRootLoggerModule {}
