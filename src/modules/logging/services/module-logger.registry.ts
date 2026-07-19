import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Logger as PinoLoggerInstance } from 'pino';
import { PINO_ROOT_LOGGER } from '../pino-root-logger.module';

export type LoggableModule =
  | 'auth'
  | 'demo'
  | 'inventory'
  | 'review'
  | 'simulation'
  | 'parent'
  | 'school'
  | 'media'
  | 'system';

export const LOGGABLE_MODULES: LoggableModule[] = [
  'auth',
  'demo',
  'inventory',
  'review',
  'simulation',
  'parent',
  'school',
  'media',
  'system',
];

@Injectable()
export class ModuleLoggerRegistry {
  private readonly loggers = new Map<LoggableModule, PinoLoggerInstance>();

  constructor(
    private readonly configService: ConfigService,
    @Inject(PINO_ROOT_LOGGER) private readonly rootLogger: PinoLoggerInstance,
  ) {}

  get defaultLevel(): string {
    return this.configService.get<string>('LOG_LEVEL') || 'info';
  }

  getLogger(module: LoggableModule): PinoLoggerInstance {
    let child = this.loggers.get(module);
    if (!child) {
      child = this.rootLogger.child({ module });
      child.level = this.defaultLevel;
      this.loggers.set(module, child);
    }
    return child;
  }

  applyLevel(module: LoggableModule, level: string): void {
    this.getLogger(module).level = level;
  }

  resetToDefault(module: LoggableModule): void {
    this.applyLevel(module, this.defaultLevel);
  }
}
