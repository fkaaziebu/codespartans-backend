import { Course as CourseTypeClass } from 'src/modules/inventory/entities/course.entity';
import { SuiteFilterInput } from 'src/modules/inventory/inputs';
import { Question as QuestionTypeClass } from 'src/modules/review/entities/question.entity';
import { SubmittedAnswer as SubmittedAnswerTypeClass } from 'src/modules/simulation/entities/sumitted_answer.entity';
import { Test as TestTypeClass, TestModeType } from 'src/modules/simulation/entities/test.entity';
import { TestAssignment } from 'src/modules/simulation/entities/test_assignment.entity';
import { InsightService, StudentService } from '../services';
import { WeeklyInsight } from '../types/weekly-insight.type';
export declare class StudentResolver {
    private readonly studentService;
    private readonly insightService;
    constructor(studentService: StudentService, insightService: InsightService);
    getSubscribedCourseDetails(context: any, courseId: string, filter?: SuiteFilterInput): Promise<CourseTypeClass>;
    getQuestion(context: any, testId: string): Promise<QuestionTypeClass>;
    getWeeklyInsight(context: any): Promise<WeeklyInsight>;
    testStats(context: any, testId: string): Promise<TestTypeClass>;
    getAllAttemptedQuestions(context: any, testId: string): Promise<SubmittedAnswerTypeClass[]>;
    startTest(context: any, suiteId: string, mode?: TestModeType): Promise<TestTypeClass>;
    pauseTest(context: any, testId: string): Promise<TestTypeClass>;
    resumeTest(context: any, testId: string): Promise<TestTypeClass>;
    endTest(context: any, testId: string): Promise<TestTypeClass>;
    submitAnswer(context: any, testId: string, questionId: string, timeRange: string, answer: string, isFlagged: boolean): Promise<SubmittedAnswerTypeClass>;
    listMyAssignments(context: any): Promise<TestAssignment[]>;
    startAssignedTest(context: any, assignmentId: string, mode?: TestModeType): Promise<TestTypeClass>;
}
