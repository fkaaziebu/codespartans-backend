import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir, readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { createGzip } from 'zlib';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Rotated, no-longer-written-to log files older than LOG_RETENTION_HOT_DAYS are
// gzipped into the archive directory and kept forever; nothing is ever deleted
// from the archive itself.
@Processor('log-archive-queue')
export class LogArchiveConsumer extends WorkerHost {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async process(): Promise<void> {
    const logDir = this.configService.get<string>('LOG_DIR') || 'logs';
    const retentionDays =
      this.configService.get<number>('LOG_RETENTION_HOT_DAYS') || 7;
    const archiveDir = join(logDir, 'archive');

    await mkdir(archiveDir, { recursive: true });

    const entries = await readdir(logDir, { withFileTypes: true });
    const cutoff = Date.now() - retentionDays * MS_PER_DAY;

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.log')) continue;

      const filePath = join(logDir, entry.name);
      const { mtimeMs } = await stat(filePath);
      if (mtimeMs >= cutoff) continue;

      const archivePath = join(archiveDir, `${entry.name}.gz`);
      await pipeline(
        createReadStream(filePath),
        createGzip(),
        createWriteStream(archivePath),
      );
      await unlink(filePath);
    }
  }
}
