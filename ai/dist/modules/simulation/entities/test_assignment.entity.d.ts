import { Child } from '../../parent/entities/child.entity';
import { Parent } from '../../parent/entities/parent.entity';
import { TestSuite } from '../../review/entities/test_suite.entity';
import { Test } from './test.entity';
export declare enum TestAssignmentStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED"
}
export declare class TestAssignment {
    id: string;
    status: TestAssignmentStatus;
    assigned_at: Date;
    completed_at: Date;
    note: string;
    parent: Parent;
    child: Child;
    test_suite: TestSuite;
    test: Test;
}
