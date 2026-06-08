import { ClassLevel } from '../entities/child.entity';
export declare class AddChildInput {
    full_name: string;
    class_level: ClassLevel;
    target_exam: string;
    school_name?: string;
}
