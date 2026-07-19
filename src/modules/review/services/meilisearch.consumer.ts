import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';
import { MeilisearchService } from './meilisearch.service';

@Processor('meilisearch-queue')
export class MeilisearchConsumer extends WorkerHost {
  private readonly log = this.loggerRegistry.getLogger('review');

  constructor(
    private readonly meilisearchService: MeilisearchService,
    private readonly loggerRegistry: ModuleLoggerRegistry,
  ) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case 'update-meilisearch-documents': {
        this.log.info('review.meilisearch.reindex.start');
        try {
          await this.meilisearchService.updateMeilisearchDocuments();
          this.log.info('review.meilisearch.reindex.completed');
        } catch (err) {
          this.log.error(
            { err: err.message },
            'review.meilisearch.reindex.failed',
          );
          throw err;
        }
        break;
      }
    }
  }
}
