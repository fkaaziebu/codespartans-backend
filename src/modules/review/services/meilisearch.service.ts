import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/modules/inventory/entities/course.entity';
import { Repository } from 'typeorm';
import { Meilisearch } from 'meilisearch';
import { ConfigService } from '@nestjs/config';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';

@Injectable()
export class MeilisearchService {
  private readonly log = this.loggerRegistry.getLogger('review');
  client: Meilisearch = null;
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    private configService: ConfigService,
    private readonly loggerRegistry: ModuleLoggerRegistry,
  ) {
    this.client = new Meilisearch({
      host: configService.get<string>('MEILI_URL'),
      apiKey: configService.get<string>('MEILI_MASTER_KEY'),
    });
  }

  async updateMeilisearchDocuments() {
    return this.courseRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Get all courses with required satellite data
        const courses = await transactionalEntityManager.find(Course, {
          where: {
            approved_version: true,
          },
          relations: ['categories', 'instructor'],
        });

        // Specify index to add documents to
        const index = this.client.index(
          this.configService.get<string>('MEILI_INDEX'),
        );

        // Meilisearch create index if not exist
        const response = await index.addDocuments(courses);
        this.log.info(
          { courseCount: courses.length, taskUid: response.taskUid },
          'review.meilisearch.documents_updated',
        );
      },
    );
  }
}
