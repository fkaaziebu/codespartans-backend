import { CurrencyType, DomainType } from 'src/modules/inventory/entities/course.entity';
export declare class UpdateCourseInfoInput {
    title?: string;
    avatar_url?: string;
    description?: string;
    domains?: DomainType[];
    price?: number;
    currency?: CurrencyType;
}
