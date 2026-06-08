import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Student } from '../../auth/entities/student.entity';
import { Test } from '../entities/test.entity';
import { WeeklyInsight } from '../types/weekly-insight.type';
export declare class InsightService {
    private studentRepository;
    private testRepository;
    private configService;
    private readonly logger;
    private readonly anthropic;
    constructor(studentRepository: Repository<Student>, testRepository: Repository<Test>, configService: ConfigService);
    getWeeklyInsight({ email }: {
        email: string;
    }): Promise<WeeklyInsight>;
}
