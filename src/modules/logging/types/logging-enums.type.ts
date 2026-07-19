import { registerEnumType } from '@nestjs/graphql';

export enum LoggableModuleEnum {
  AUTH = 'auth',
  DEMO = 'demo',
  INVENTORY = 'inventory',
  REVIEW = 'review',
  SIMULATION = 'simulation',
  PARENT = 'parent',
  SCHOOL = 'school',
  MEDIA = 'media',
  SYSTEM = 'system',
}

registerEnumType(LoggableModuleEnum, {
  name: 'LoggableModule',
  description: 'Module that can have its log level controlled independently',
});

export enum LogLevelEnum {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

registerEnumType(LogLevelEnum, {
  name: 'LogLevel',
  description: 'Pino log level',
});
