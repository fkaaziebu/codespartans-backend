// logger.ts — Pino with daily rotation, 15-day retention
// One file per day, named: examforge-app-YYYY-MM-DD.log
// Rotation via pino-roll (in-process, no logrotate/cron dependency needed).

import pino from 'pino';
import { randomUUID } from 'crypto';
import path from 'path';
import type { Request, Response, NextFunction } from 'express';

const LOG_DIR = process.env.LOG_DIR || '/var/log/examforge';

// ---------------------------------------------------------------------------
// 1. Transport: pino-roll rotates daily and stamps each file with the date.
//    `mkdir: true` creates LOG_DIR if it doesn't exist.
//    `frequency: 'daily'` rolls at midnight (server local time).
//    `limit.count: 15` keeps only the 15 most recent files — this is what
//    gives you the 15-day retention without a separate cron job.
// ---------------------------------------------------------------------------
const transport = pino.transport({
  target: 'pino-roll',
  options: {
    file: path.join(LOG_DIR, 'examforge-app'), // pino-roll appends -YYYY-MM-DD.log
    frequency: 'daily',
    dateFormat: 'yyyy-MM-dd',
    mkdir: true,
    limit: { count: 15 }, // auto-deletes oldest once 16th file would be created
    extension: '.log',
  },
});

// ---------------------------------------------------------------------------
// 2. Base logger — same redaction/level behavior as before, now writing
//    to the rotating file transport instead of stdout.
// ---------------------------------------------------------------------------
export const baseLogger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    redact: {
      paths: [
        'req.headers.authorization',
        'req.body.email',
        'req.body.name',
        'req.body.pin',
        '*.email',
        '*.pin',
        '*.password',
      ],
      censor: '[REDACTED]',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: { app: 'examforge', env: process.env.NODE_ENV || 'production' },
  },
  transport,
);

// ---------------------------------------------------------------------------
// 3. Per-module child loggers — unchanged from before, still independently
//    controllable, still writing into the same daily file.
// ---------------------------------------------------------------------------
const moduleLevels: Record<string, string> = {
  webhooks: process.env.LOG_LEVEL_WEBHOOKS || 'info',
  sse: process.env.LOG_LEVEL_SSE || 'info',
  auth: process.env.LOG_LEVEL_AUTH || 'info',
};

export function getModuleLogger(module: keyof typeof moduleLevels) {
  return baseLogger.child({ module }, { level: moduleLevels[module] });
}

export function setModuleLevelTemporarily(
  module: keyof typeof moduleLevels,
  level: string,
  ttlMinutes = 10,
) {
  moduleLevels[module] = level;
  baseLogger.info({ module, level, ttlMinutes }, 'log-level.override.set');
  setTimeout(() => {
    moduleLevels[module] = 'info';
    baseLogger.info({ module }, 'log-level.override.expired');
  }, ttlMinutes * 60 * 1000);
}

// ---------------------------------------------------------------------------
// 4. Request middleware — same as before, correlation ID per request.
// ---------------------------------------------------------------------------
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  req.log = baseLogger.child({ requestId, userId: req.user?.id ?? 'anon' });
  res.setHeader('x-request-id', requestId);

  const start = Date.now();
  req.log.info({ method: req.method, path: req.path }, 'request.start');

  res.on('finish', () => {
    req.log.info(
      {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
      },
      'request.end',
    );
  });

  next();
}

// ---------------------------------------------------------------------------
// Result on disk (LOG_DIR = /var/log/examforge):
//
//   examforge-app-2026-07-19.log   (today)
//   examforge-app-2026-07-18.log
//   examforge-app-2026-07-17.log
//   ... up to 15 files, oldest auto-deleted as new ones roll in
//
// Install:
//   npm install pino-roll
//
// Usage in Express app:
//   app.use(requestLogger);
//
// Usage in a service:
//   const log = getModuleLogger('webhooks');
//   log.info({ paystackRef }, 'webhook.received');
//
// Note: if you ever move to multi-instance/PM2 clustering, pino-roll's
// file-based rotation still works per-process, but you'd want each instance
// writing to a distinct file (e.g. append PID) or centralize via a shared
// transport target to avoid write contention on the same file handle.
// ---------------------------------------------------------------------------
