import { PaginationInput } from './inputs';
export declare class PaginateHelper {
    static paginate<T>(items: T[], paginationInput: PaginationInput, cursorExtractor: (item: T) => string | number): {
        edges: {
            cursor: string;
            node: T;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string;
            endCursor: string;
        };
        count: number;
    };
    private static encodeCursor;
    private static decodeCursor;
}
