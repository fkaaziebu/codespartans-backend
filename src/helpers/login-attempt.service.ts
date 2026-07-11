import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

interface LockoutConfig {
  maxAttempts: number;
  lockTtlMs: number;
  attemptsTtlMs: number;
}

@Injectable()
export class LoginAttemptService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async assertNotLocked(
    keyPrefix: string,
    id: string,
    lockedMessage: string,
  ): Promise<void> {
    const lockedAt = await this.cacheManager.get<string>(
      `${keyPrefix}_locked:${id}`,
    );
    if (lockedAt) {
      throw new UnauthorizedException({
        message: lockedMessage,
        code: 'ACCOUNT_LOCKED',
        locked_at: lockedAt,
      });
    }
  }

  async resetStaleAttemptsIfMaxed(
    keyPrefix: string,
    id: string,
    cfg: LockoutConfig,
  ): Promise<void> {
    const attemptsKey = `${keyPrefix}_attempts:${id}`;
    const current = (await this.cacheManager.get<number>(attemptsKey)) ?? 0;
    if (current >= cfg.maxAttempts) {
      await this.cacheManager.del(attemptsKey);
    }
  }

  async recordFailure(
    keyPrefix: string,
    id: string,
    cfg: LockoutConfig,
    lockedMessage: string,
    failureMessages: Record<number, string> & { default: string },
    failureCode = 'INVALID_CREDENTIALS',
  ): Promise<never> {
    const attemptsKey = `${keyPrefix}_attempts:${id}`;
    const lockedKey = `${keyPrefix}_locked:${id}`;
    const attempts = ((await this.cacheManager.get<number>(attemptsKey)) ?? 0) + 1;
    await this.cacheManager.set(attemptsKey, attempts, cfg.attemptsTtlMs);

    if (attempts >= cfg.maxAttempts) {
      const timestamp = new Date().toISOString();
      await this.cacheManager.set(lockedKey, timestamp, cfg.lockTtlMs);
      throw new UnauthorizedException({
        message: lockedMessage,
        code: 'ACCOUNT_LOCKED',
        locked_at: timestamp,
      });
    }

    throw new UnauthorizedException({
      message: failureMessages[attempts] ?? failureMessages.default,
      code: failureCode,
      attempts_remaining: cfg.maxAttempts - attempts,
    });
  }

  async clear(keyPrefix: string, id: string): Promise<void> {
    await this.cacheManager.del(`${keyPrefix}_attempts:${id}`);
  }
}
