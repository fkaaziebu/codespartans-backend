import { Repository } from 'typeorm';
import { Student } from '../../auth/entities/student.entity';
import { Question } from '../../review/entities/question.entity';
import { SubmittedAnswer } from '../entities/sumitted_answer.entity';
import { Test } from '../entities/test.entity';
import { TestAssignment } from '../entities/test_assignment.entity';
import { TestModeType } from '../entities/test.entity';
import { StudentGateway } from '../gateways/student.gateway';
import { TestTimerService } from './test-timer.service';
import { MarkAnswerProducer } from './mark-answer.producer';
import { MarkAnswerService } from './mark-answer.service';
import { Course as CourseTypeClass } from '../../inventory/entities/course.entity';
import { SuiteFilterInput } from '../../inventory/inputs';
export declare class StudentService {
    private studentRepository;
    private testAssignmentRepository;
    private timerService;
    private sseGateway;
    private markAnswerProducer;
    private markAnswerService;
    private readonly logger;
    constructor(studentRepository: Repository<Student>, testAssignmentRepository: Repository<TestAssignment>, timerService: TestTimerService, sseGateway: StudentGateway, markAnswerProducer: MarkAnswerProducer, markAnswerService: MarkAnswerService);
    startTest({ email, suiteId, mode, }: {
        email: string;
        suiteId: string;
        mode?: TestModeType;
    }): Promise<Test>;
    pauseTest({ email, testId }: {
        email: string;
        testId: string;
    }): Promise<Test>;
    resumeTest({ email, testId }: {
        email: string;
        testId: string;
    }): Promise<Test>;
    endTest({ email, testId }: {
        email: string;
        testId: string;
    }): Promise<Test>;
    getQuestion({ email, testId }: {
        email: string;
        testId: string;
    }): Promise<Question>;
    getSubscribedCourseDetails({ email, courseId, filter, }: {
        email: string;
        courseId: string;
        filter?: SuiteFilterInput;
    }): Promise<CourseTypeClass>;
    submitAnswer({ email, testId, questionId, timeRange, answer, isFlagged, }: {
        email: string;
        testId: string;
        questionId: string;
        timeRange: string;
        answer: string;
        isFlagged: boolean;
    }): Promise<SubmittedAnswer>;
    getAllAttemptedQuestions({ email, testId, }: {
        email: string;
        testId: string;
    }): Promise<SubmittedAnswer[]>;
    testStats({ email, testId }: {
        email: string;
        testId: string;
    }): Promise<Test>;
    handleStudentReconnection(testId: string, studentId: string): Promise<{
        test: Test;
        action: string;
    }>;
    listMyAssignments({ email }: {
        email: string;
    }): Promise<TestAssignment[]>;
    startAssignedTest({ email, assignmentId, mode, }: {
        email: string;
        assignmentId: string;
        mode?: TestModeType;
    }): Promise<Test>;
    getActiveTest(studentId: string): Promise<Test>;
    private handleTimerTick;
    private calculateEndTime;
    private calculateTimeUsed;
}
