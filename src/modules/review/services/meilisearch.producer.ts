import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class MeilisearchProducer {
  constructor(
    @InjectQueue('meilisearch-queue') private readonly meilisearchQueue: Queue,
  ) {}

  async updateMeilisearchDocuments() {
    await this.meilisearchQueue.add('update-meilisearch-documents', {});
  }
}
