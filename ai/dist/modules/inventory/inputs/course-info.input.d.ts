import { CurrencyType, DomainType, LevelType } from 'src/modules/inventory/entities/course.entity';
export declare class CourseInfoInput {
    title: string;
    avatar_url: string;
    description: string;
    domains: DomainType[];
    price: number;
    currency: CurrencyType;
    level: LevelType;
}
