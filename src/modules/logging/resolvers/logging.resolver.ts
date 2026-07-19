import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlJwtAuthGuard } from 'src/helpers/guards';
import { PaginationInput } from 'src/helpers/inputs';
import { GenpopOnlyGuard } from '../guards/genpop-only.guard';
import { LogHistoryInput } from '../inputs/log-history.input';
import { SetLogLevelInput } from '../inputs/set-log-level.input';
import { LogLevelStore } from '../services/log-level.store';
import { LogsHistoryService } from '../services/logs-history.service';
import { LoggableModule } from '../services/module-logger.registry';
import { LogEntryConnection } from '../types/log-entry-connection.type';

@Resolver()
export class LoggingResolver {
  constructor(
    private readonly logLevelStore: LogLevelStore,
    private readonly logsHistoryService: LogsHistoryService,
  ) {}

  @UseGuards(GqlJwtAuthGuard, GenpopOnlyGuard)
  @Query(() => LogEntryConnection)
  async logHistory(
    @Args('input') input: LogHistoryInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    return this.logsHistoryService.search(input, pagination);
  }

  @UseGuards(GqlJwtAuthGuard, GenpopOnlyGuard)
  @Mutation(() => Boolean)
  async setModuleLogLevel(@Args('input') input: SetLogLevelInput) {
    await this.logLevelStore.setOverride(
      input.module as LoggableModule,
      input.level,
      (input.ttlMinutes ?? 10) * 60,
    );
    return true;
  }
}
