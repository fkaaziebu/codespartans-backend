import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { SubmittedAnswer } from '../entities/sumitted_answer.entity';
export declare class MarkAnswerService {
    private submittedAnswerRepository;
    private configService;
    private readonly logger;
    private readonly anthropic;
    constructor(submittedAnswerRepository: Repository<SubmittedAnswer>, configService: ConfigService);
    markShortAnswer(submittedAnswerId: string): Promise<SubmittedAnswer>;
}
