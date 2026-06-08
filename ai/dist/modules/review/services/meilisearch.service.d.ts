import { Course } from 'src/modules/inventory/entities/course.entity';
import { Repository } from 'typeorm';
import { Meilisearch } from 'meilisearch';
import { ConfigService } from '@nestjs/config';
export declare class MeilisearchService {
    private courseRepository;
    private configService;
    private readonly logger;
    client: Meilisearch;
    constructor(courseRepository: Repository<Course>, configService: ConfigService);
    updateMeilisearchDocuments(): Promise<void>;
}
