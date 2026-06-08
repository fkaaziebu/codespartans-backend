import { Recommendation } from './recommendation.entity';
import { Student } from '../../auth/entities/student.entity';
import { SubmittedAnswer } from './sumitted_answer.entity';
import { TestSuite } from '../../review/entities/test_suite.entity';
import { TimeEvent } from './time_event.entity';
import { TestAssignment } from './test_assignment.entity';
export declare enum TestStatusType {
    ON_GOING = "ON_GOING",
    PAUSED = "PAUSED",
    ENDED = "ENDED"
}
export declare enum TestModeType {
    PROCTURED = "PROCTURED",
    UN_PROCTURED = "UN_PROCTURED"
}
export declare class Test {
    id: string;
    status: TestStatusType;
    mode: TestModeType;
    test_suite: TestSuite;
    submitted_answers: SubmittedAnswer[];
    time_events: TimeEvent[];
    recommendations: Recommendation[];
    course_id?: string;
    course_category?: string;
    student: Student;
    assignment: TestAssignment;
}
