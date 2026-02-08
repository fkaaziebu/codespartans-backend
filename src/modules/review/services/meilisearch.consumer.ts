import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MeilisearchService } from './meilisearch.service';

@Processor('meilisearch-queue')
export class MeilisearchConsumer extends WorkerHost {
  constructor(private readonly meilisearchService: MeilisearchService) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case 'update-meilisearch-documents': {
        await this.meilisearchService.updateMeilisearchDocuments();

        break;
      }
    }
  }
}
