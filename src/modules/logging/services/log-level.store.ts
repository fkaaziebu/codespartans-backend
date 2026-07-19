import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  LOGGABLE_MODULES,
  LoggableModule,
  ModuleLoggerRegistry,
} from './module-logger.registry';

const CHANNEL = 'log:level:changes';
const RECONCILE_INTERVAL_MS = 60_000;

interface LevelChangeMessage {
  module: LoggableModule;
  level: string | null;
}

// Runtime log-level overrides are stored in Redis (not in-memory) so that every
// app instance behind the load balancer picks up the same override — a single
// gen_pop-triggered change must apply cluster-wide, not just to whichever pod
// handled that GraphQL mutation.
@Injectable()
export class LogLevelStore implements OnModuleInit, OnModuleDestroy {
  private readonly client: Redis;
  private readonly subscriber: Redis;
  private reconcileTimer: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService,
    private readonly registry: ModuleLoggerRegistry,
  ) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.client = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);
  }

  async onModuleInit(): Promise<void> {
    await this.subscriber.subscribe(CHANNEL);
    this.subscriber.on('message', (_channel, raw) => {
      const { module, level } = JSON.parse(raw) as LevelChangeMessage;
      this.registry.applyLevel(module, level ?? this.registry.defaultLevel);
    });

    // Redis doesn't push expiry events by default (keyspace-notifications is an
    // opt-in server setting we don't want to require) and a freshly booted
    // instance needs to catch up to any override already in effect — this
    // periodic reconciliation covers both cases.
    await this.reconcile();
    this.reconcileTimer = setInterval(
      () => void this.reconcile(),
      RECONCILE_INTERVAL_MS,
    );
  }

  async onModuleDestroy(): Promise<void> {
    clearInterval(this.reconcileTimer);
    await this.subscriber.quit();
    await this.client.quit();
  }

  private key(module: LoggableModule): string {
    return `log:level:${module}`;
  }

  async setOverride(
    module: LoggableModule,
    level: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.client.set(this.key(module), level, 'EX', ttlSeconds);
    await this.client.publish(CHANNEL, JSON.stringify({ module, level }));
  }

  async clearOverride(module: LoggableModule): Promise<void> {
    await this.client.del(this.key(module));
    await this.client.publish(
      CHANNEL,
      JSON.stringify({ module, level: null }),
    );
  }

  private async reconcile(): Promise<void> {
    for (const module of LOGGABLE_MODULES) {
      const level = await this.client.get(this.key(module));
      this.registry.applyLevel(module, level ?? this.registry.defaultLevel);
    }
  }
}
