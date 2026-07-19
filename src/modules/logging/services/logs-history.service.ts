import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'fs';
import { readdir } from 'fs/promises';
import { createInterface } from 'readline';
import { join } from 'path';
import { createGunzip } from 'zlib';
import { PaginateHelper } from 'src/helpers/paginate.helper';
import { PaginationInput } from 'src/helpers/inputs';
import { LogHistoryInput } from '../inputs/log-history.input';
import { LogEntry } from '../types/log-entry.type';

interface RawLine {
  line: string;
  sourceFile: string;
}

@Injectable()
export class LogsHistoryService {
  constructor(private readonly configService: ConfigService) {}

  async search(input: LogHistoryInput, pagination?: PaginationInput) {
    const logDir = this.configService.get<string>('LOG_DIR') || 'logs';

    const rawLines = await this.collectLines(logDir, !!input.includeArchived);

    const entries = rawLines
      .map((raw, index) => this.parseLine(raw, index))
      .filter((entry): entry is LogEntry => entry !== null)
      .filter((entry) => this.matches(entry, input))
      .sort((a, b) => (a.time < b.time ? 1 : a.time > b.time ? -1 : 0));

    return PaginateHelper.paginate(
      entries,
      pagination,
      (entry) => entry.cursorId,
    );
  }

  private async collectLines(
    logDir: string,
    includeArchived: boolean,
  ): Promise<RawLine[]> {
    const lines: RawLine[] = [];

    const hotFiles = await this.listFiles(logDir, '.log');
    for (const file of hotFiles) {
      const filePath = join(logDir, file);
      for await (const line of this.readPlainLines(filePath)) {
        lines.push({ line, sourceFile: file });
      }
    }

    if (includeArchived) {
      const archiveDir = join(logDir, 'archive');
      const archivedFiles = await this.listFiles(archiveDir, '.gz');
      for (const file of archivedFiles) {
        const filePath = join(archiveDir, file);
        for await (const line of this.readGzipLines(filePath)) {
          lines.push({ line, sourceFile: join('archive', file) });
        }
      }
    }

    return lines;
  }

  private async listFiles(dir: string, extension: string): Promise<string[]> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
        .map((entry) => entry.name);
    } catch {
      return [];
    }
  }

  private async *readPlainLines(filePath: string): AsyncIterable<string> {
    const rl = createInterface({
      input: createReadStream(filePath),
      crlfDelay: Infinity,
    });
    for await (const line of rl) {
      if (line.trim()) yield line;
    }
  }

  private async *readGzipLines(filePath: string): AsyncIterable<string> {
    const rl = createInterface({
      input: createReadStream(filePath).pipe(createGunzip()),
      crlfDelay: Infinity,
    });
    for await (const line of rl) {
      if (line.trim()) yield line;
    }
  }

  private parseLine(raw: RawLine, index: number): LogEntry | null {
    try {
      const parsed = JSON.parse(raw.line);
      const entry = new LogEntry();
      entry.time = parsed.time ?? '';
      entry.level = parsed.level ?? 'info';
      entry.module = parsed.module;
      entry.requestId = parsed.reqId ?? parsed.requestId;
      entry.msg = parsed.msg;
      entry.sourceFile = raw.sourceFile;
      entry.raw = raw.line;
      entry.cursorId = `${raw.sourceFile}:${index}`;
      return entry;
    } catch {
      return null;
    }
  }

  private matches(entry: LogEntry, input: LogHistoryInput): boolean {
    if (input.module && entry.module !== input.module) return false;
    if (input.level && entry.level !== input.level) return false;
    if (input.requestId && entry.requestId !== input.requestId) return false;
    if (input.from && new Date(entry.time) < input.from) return false;
    if (input.to && new Date(entry.time) > input.to) return false;
    return true;
  }
}
