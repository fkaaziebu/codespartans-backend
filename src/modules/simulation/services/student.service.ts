import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { In, Repository } from 'typeorm';
import { Student } from '../../auth/entities/student.entity';
import { Course } from '../../inventory/entities/course.entity';
import { Question, QuestionType } from '../../review/entities/question.entity';
import { Recommendation } from '../entities/recommendation.entity';
import { SubmittedAnswer } from '../entities/sumitted_answer.entity';
import { Test } from '../entities/test.entity';
import {
  TestAssignment,
  TestAssignmentStatus,
} from '../entities/test_assignment.entity';
import { TimeEvent } from '../entities/time_event.entity';
import { TimeEventType } from '../entities/time_event.entity';
import { TestModeType, TestStatusType } from '../entities/test.entity';
import { Child } from '../../parent/entities/child.entity';
import { StudentGateway } from '../gateways/student.gateway';
import { TestTimerService } from './test-timer.service';
import { MarkAnswerProducer } from './mark-answer.producer';
import { MarkAnswerService } from './mark-answer.service';
import { InsightService } from './insight.service';
import { Course as CourseTypeClass } from '../../inventory/entities/course.entity';
import { SuiteFilterInput } from '../../inventory/inputs';
import { SuiteType } from '../../review/entities/test_suite.entity';

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(TestAssignment)
    private testAssignmentRepository: Repository<TestAssignment>,
    private timerService: TestTimerService,
    private sseGateway: StudentGateway,
    private markAnswerProducer: MarkAnswerProducer,
    private markAnswerService: MarkAnswerService,
    private insightService: InsightService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async startTest({
    id,
    suiteId,
    mode = TestModeType.PROCTURED,
  }: {
    id: string;
    suiteId: string;
    mode?: TestModeType;
  }) {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: {
            id,
            subscribed_courses: {
              versions: {
                test_suites: {
                  id: suiteId,
                },
              },
            },
          },
          relations: [
            'subscribed_courses.versions.test_suites',
            'subscribed_courses.versions.questions',
          ],
        });

        if (!student) {
          throw new NotFoundException('You do not have access to this suite ');
        }

        const on_going_tests = await transactionalEntityManager.find(Test, {
          where: {
            student: {
              id: student.id,
            },
            status: In([TestStatusType.ON_GOING, TestStatusType.PAUSED]),
          },
        });

        if (on_going_tests.length) {
          throw new ConflictException('You already have an ongoing test');
        }

        const new_test = new Test();
        new_test.test_suite =
          student.subscribed_courses[0].versions[0].test_suites[0];
        new_test.student = student;
        new_test.mode = mode;

        await transactionalEntityManager.save(new_test);

        const time_event = new TimeEvent();
        time_event.recorded_at = new Date();
        time_event.test = new_test;
        await transactionalEntityManager.save(time_event);

        const testId = new_test.id;
        const studentId = student.id;

        const endTime = new Date(
          new Date(time_event.recorded_at).setSeconds(
            (student.subscribed_courses[0].versions[0].questions.reduce(
              (acc, question) => acc + question.estimated_time_in_ms,
              0,
            ) || 0) / 1000,
          ),
        );

        this.timerService.startTimer(
          testId,
          studentId,
          endTime,
          (remaining_ms) =>
            this.handleTimerTick(testId, studentId, remaining_ms),
          async () => await this.endTest({ id, testId: new_test.id }),
        );

        this.logger.log(`Test ${new_test.id} started for student ${studentId}`);

        return new_test;
      },
    );
  }

  async pauseTest({ id, testId }: { id: string; testId: string }) {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: {
            id,
            tests: {
              id: testId,
            },
          },
          relations: ['tests.time_events'],
        });

        if (!student) {
          throw new NotFoundException('You do not have access to this test');
        }

        const time_event = new TimeEvent();
        time_event.recorded_at = new Date();
        time_event.type = TimeEventType.PAUSED;
        time_event.test = student.tests[0];
        await transactionalEntityManager.save(time_event);

        student.tests[0].status = TestStatusType.PAUSED;
        student.tests[0].time_events.push(time_event);
        const updated_test = await transactionalEntityManager.save(
          student.tests[0],
        );

        this.timerService.pauseTimer(testId, student.id);

        this.logger.log(
          `Test ${updated_test.id} paused for student ${student.id}`,
        );
        return updated_test;
      },
    );
  }

  async resumeTest({ id, testId }: { id: string; testId: string }) {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: {
            id,
            tests: {
              id: testId,
            },
          },
          relations: ['tests.test_suite.questions', 'tests.time_events'],
        });

        if (!student) {
          throw new NotFoundException('You do not have access to this test');
        }

        const time_event = new TimeEvent();
        time_event.recorded_at = new Date();
        time_event.type = TimeEventType.RESUMED;
        time_event.test = student.tests[0];
        await transactionalEntityManager.save(time_event);

        student.tests[0].status = TestStatusType.ON_GOING;
        student.tests[0].time_events.push(time_event);
        const updated_test = await transactionalEntityManager.save(
          student.tests[0],
        );

        const totalEstimatedMs =
          updated_test.test_suite.questions.reduce(
            (acc, question) => acc + question.estimated_time_in_ms,
            0,
          ) || 0;

        const endTime = this.calculateEndTime(
          updated_test.time_events,
          totalEstimatedMs,
        );

        this.timerService.resumeTimer(
          testId,
          student.id,
          endTime,
          (remainingMs) =>
            this.handleTimerTick(testId, student.id, remainingMs),
          async () => await this.endTest({ id: student.id, testId }),
        );

        this.logger.log(
          `Test ${updated_test.id} resumed for student ${student.id}`,
        );

        return updated_test;
      },
    );
  }

  async endTest({ id, testId }: { id: string; testId: string }) {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: {
            id,
            tests: {
              id: testId,
            },
          },
          relations: ['tests'],
        });

        if (!student) {
          throw new NotFoundException('You do not have access to this test');
        }

        const time_event = new TimeEvent();
        time_event.recorded_at = new Date();
        time_event.type = TimeEventType.ENDED;
        time_event.test = student.tests[0];
        await transactionalEntityManager.save(time_event);

        student.tests[0].status = TestStatusType.ENDED;

        const studentId = student.id;
        this.timerService.stopTimer(testId, studentId);

        this.sseGateway.sendTestEnded(testId, studentId);

        const savedTest = await transactionalEntityManager.save(
          student.tests[0],
        );

        const linkedAssignment = await transactionalEntityManager.findOne(
          TestAssignment,
          { where: { test: { id: testId } } },
        );

        if (linkedAssignment) {
          linkedAssignment.status = TestAssignmentStatus.COMPLETED;
          linkedAssignment.completed_at = new Date();
          await transactionalEntityManager.save(
            TestAssignment,
            linkedAssignment,
          );
        }

        this.logger.log(`Test ${testId} ended for student ${studentId}`);

        // Invalidate stale weekly insight so next call regenerates with fresh data
        await this.insightService.invalidateForStudent(studentId);

        await Promise.all([
          this.cacheManager.del(`student-stats:${id}`),
          this.cacheManager.del(`student-streak:${id}`),
          this.cacheManager.del(`student-subject-progress:${id}:all`),
          this.cacheManager.del(`student-weak-areas:${id}:all`),
          this.cacheManager.del(`student-score-history:${id}:all`),
          this.cacheManager.del(`student-aggregate:${id}`),
        ]);

        return savedTest;
      },
    );
  }

  async getQuestion({ id, testId }: { id: string; testId: string }) {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: {
            id,
            tests: {
              id: testId,
            },
          },
          relations: ['tests.test_suite.questions', 'tests.submitted_answers'],
        });

        if (!student) {
          throw new NotFoundException('You do not have access to this suite');
        }

        if (
          student.tests[0].submitted_answers.length ===
          student.tests[0].test_suite.questions.length
        ) {
          throw new BadRequestException(
            'You have answered all qustions in the suite',
          );
        }

        const unanswered_questions =
          student.tests[0].test_suite.questions.filter(
            (question) =>
              !student.tests[0].submitted_answers
                .map((answer) => answer.question_id)
                .includes(question.id),
          );

        const random_index = Math.floor(
          Math.random() * unanswered_questions.length,
        );
        return unanswered_questions[random_index];
      },
    );
  }

  async getSubscribedCourseDetails({
    id,
    courseId,
    filter,
  }: {
    id: string;
    courseId: string;
    filter?: SuiteFilterInput;
  }): Promise<CourseTypeClass> {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: {
            id,
            subscribed_courses: {
              id: courseId,
            },
          },
          relations: [
            'subscribed_courses.approved_version.test_suites.questions',
            'subscribed_courses.approved_version.questions',
            'subscribed_courses.instructor',
          ],
        });

        const test = await transactionalEntityManager.find(Test, {
          where: {
            student: {
              id,
            },
            test_suite: In(
              student.subscribed_courses[0].approved_version.test_suites.map(
                (st) => st.id,
              ),
            ),
          },
          relations: [
            'test_suite',
            'submitted_answers.question',
            'time_events',
          ],
        });

        const allSuites =
          student.subscribed_courses[0].approved_version.test_suites;
        const suitesToReturn = filter?.suite_type
          ? allSuites.filter((suite) => suite.suite_type === filter.suite_type)
          : allSuites;

        return {
          ...student.subscribed_courses[0],
          approved_version: {
            ...student.subscribed_courses[0].approved_version,
            test_suites: suitesToReturn.map((suite) => ({
              ...suite,
              attempts: test
                .filter((tst) => tst.test_suite.id === suite.id)
                .sort(
                  (a, b) =>
                    new Date(
                      a.time_events.find(
                        (e) => e.type === TimeEventType.STARTED,
                      ).recorded_at,
                    ).valueOf() -
                    new Date(
                      b.time_events.find(
                        (e) => e.type === TimeEventType.STARTED,
                      ).recorded_at,
                    ).valueOf(),
                ),
            })),
          },
        };
      },
    );
  }

  async submitAnswer({
    id,
    testId,
    questionId,
    timeRange,
    answer,
    isFlagged,
  }: {
    id: string;
    testId: string;
    questionId: string;
    timeRange: string;
    answer: string;
    isFlagged: boolean;
  }) {
    let isNonDeterministic = false;
    let testMode: TestModeType;

    const saved = await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: {
            id,
            tests: {
              id: testId,
            },
          },
          relations: ['tests.test_suite.questions', 'tests.submitted_answers'],
        });

        if (!student) {
          throw new NotFoundException('You do not have access to this suite');
        }

        if (student.tests[0].status === TestStatusType.ENDED) {
          throw new BadRequestException(
            "Test has ended, you can't submit answers for an ended test",
          );
        }

        if (student.tests[0].status === TestStatusType.PAUSED) {
          throw new BadRequestException(
            'Test is paused, resume to submit answer',
          );
        }

        const question = await transactionalEntityManager.findOne(Question, {
          where: { id: questionId },
        });

        isNonDeterministic =
          question?.type === QuestionType.SHORT_ANSWER ||
          question?.type === QuestionType.FILL_IN;

        testMode = student.tests[0].mode;

        const existingAnswer = student.tests[0].submitted_answers.find(
          (ans) => ans.question_id === questionId,
        );

        if (existingAnswer) {
          existingAnswer.answer_provided = answer;
          existingAnswer.is_flagged = isFlagged;
          existingAnswer.time_ranges.push(timeRange);

          if (isNonDeterministic) {
            existingAnswer.is_correct = null;
            existingAnswer.is_marked = false;
          } else {
            existingAnswer.is_correct = answer === question?.correct_answer;
            existingAnswer.is_marked = true;
          }

          return await transactionalEntityManager.save(existingAnswer);
        } else {
          const newAnswer = new SubmittedAnswer();
          newAnswer.question_id = questionId;
          newAnswer.answer_provided = answer;
          newAnswer.time_ranges = [timeRange];
          newAnswer.is_flagged = isFlagged;
          newAnswer.test = student.tests[0];
          newAnswer.question = question;

          if (isNonDeterministic) {
            newAnswer.is_correct = null;
            newAnswer.is_marked = false;
          } else {
            newAnswer.is_correct = answer === question?.correct_answer;
            newAnswer.is_marked = true;
          }

          return await transactionalEntityManager.save(newAnswer);
        }
      },
    );

    if (isNonDeterministic) {
      if (testMode === TestModeType.UN_PROCTURED) {
        return await this.markAnswerService.markShortAnswer(saved.id);
      } else {
        await this.markAnswerProducer.markShortAnswer({
          submittedAnswerId: saved.id,
        });
      }
    }

    return saved;
  }

  async getAllAttemptedQuestions({
    id,
    testId,
  }: {
    id: string;
    testId: string;
  }) {
    const student = await this.studentRepository.findOne({
      where: {
        id,
        tests: {
          id: testId,
        },
      },
      relations: [
        'tests.submitted_answers.question',
        'tests.time_events',
        'tests.recommendations',
      ],
    });

    if (!student) {
      throw new NotFoundException('You do not have access to this suite');
    }

    const test = student.tests[0];

    if (test.status === TestStatusType.ENDED) {
      throw new BadRequestException('Test has ended');
    }

    return test.submitted_answers;
  }

  async testStats({ id, testId }: { id: string; testId: string }) {
    const cacheKey = `test-stats:${testId}`;
    const cached = await this.cacheManager.get<Test>(cacheKey);
    if (cached) {
      return cached;
    }

    const student = await this.studentRepository.findOne({
      where: {
        id,
        tests: {
          id: testId,
        },
      },
      relations: [
        'tests.submitted_answers.question',
        'tests.time_events',
        'tests.recommendations',
        'tests.test_suite.questions',
      ],
    });

    if (!student) {
      throw new NotFoundException('You do not have access to this suite');
    }

    const test = student.tests[0];

    if (test.status !== TestStatusType.ENDED) {
      throw new BadRequestException('Test is not ended');
    }

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    await this.cacheManager.set(cacheKey, test, SEVEN_DAYS_MS);

    return test;
  }

  /**
   * Handle student reconnection
   * This is crucial for the edge case where a student disconnects
   * and the test should have already ended
   */
  async handleStudentReconnection(
    testId: string,
    studentId: string,
  ): Promise<{ test: Test; action: string }> {
    const student = await this.studentRepository.findOne({
      where: {
        id: studentId,
        tests: {
          id: testId,
        },
      },
      relations: ['tests.time_events', 'tests.test_suite.questions'],
    });

    this.logger.log(`StudentId: ${studentId}, TestId: ${testId}`);

    if (!student || !studentId || !testId) {
      throw new NotFoundException('You do not have access to this suite');
    }

    const test = student.tests[0];

    this.logger.log(
      `Student ${studentId} reconnected to test ${testId}. Current status: ${test.status}`,
    );

    const totalEstimatedMs =
      student.tests[0].test_suite.questions.reduce(
        (acc, question) => acc + question.estimated_time_in_ms,
        0,
      ) || 0;

    const endTime = this.calculateEndTime(test.time_events, totalEstimatedMs);

    const now = new Date();
    const remainingMs = endTime.getTime() - now.getTime();

    // Check if test is on_going
    if (test.status === TestStatusType.ON_GOING) {
      // Critical: Check if test should have ended
      if (remainingMs <= 0) {
        this.logger.warn(
          `Test ${testId} for student ${studentId} has expired. Ending test.`,
        );

        const ended_test = await this.endTest({ id: student.id, testId });

        // Send test ended event via SSE
        this.sseGateway.sendTestEnded(testId, studentId);

        return {
          test: ended_test,
          action: 'test_ended',
        };
      }

      // Test is still ongoing, restart timer
      this.timerService.startTimer(
        testId,
        studentId,
        endTime,
        (remainingMs) => this.handleTimerTick(testId, studentId, remainingMs),
        async () => await this.endTest({ id: student.id, testId }),
      );

      // Send current remaining time to student
      this.sseGateway.sendTimeUpdate(testId, studentId, remainingMs);

      return {
        test,
        action: 'test_resumed',
      };
    }

    // Test is paused, send current remaining time
    if (test.status === TestStatusType.PAUSED && remainingMs) {
      this.sseGateway.sendTestPaused(testId, studentId, remainingMs);
      return {
        test,
        action: 'test_paused',
      };
    }

    // Test has ended
    if (test.status === TestStatusType.ENDED) {
      this.sseGateway.sendTestEnded(testId, studentId);
      return {
        test,
        action: 'test_ended',
      };
    }

    return {
      test,
      action: 'test_not_started',
    };
  }

  async listMyAssignments({ id }: { id: string }): Promise<TestAssignment[]> {
    const student = await this.studentRepository.findOne({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const child = await this.studentRepository.manager.findOne(Child, {
      where: { student: { id: student.id } },
    });

    if (!child) {
      return [];
    }

    const assignments = await this.testAssignmentRepository.find({
      where: { child: { id: child.id } },
      relations: [
        'test_suite',
        'test',
        'test.test_suite',
        'test.test_suite.course_version',
        'test.test_suite.course_version.course',
        'parent',
      ],
      order: { assigned_at: 'DESC' },
    });

    return assignments.map((assignment) => {
      if (assignment.test) {
        assignment.test.course_id =
          assignment.test.test_suite?.course_version?.course?.id ?? undefined;
      }
      return assignment;
    });
  }

  async startAssignedTest({
    id,
    assignmentId,
    mode = TestModeType.PROCTURED,
  }: {
    id: string;
    assignmentId: string;
    mode?: TestModeType;
  }) {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: { id },
        });

        if (!student) {
          throw new NotFoundException('Student not found');
        }

        const child = await transactionalEntityManager.findOne(Child, {
          where: { student: { id: student.id } },
        });

        if (!child) {
          throw new NotFoundException('Child profile not found');
        }

        const assignment = await transactionalEntityManager.findOne(
          TestAssignment,
          {
            where: { id: assignmentId, child: { id: child.id } },
            relations: [
              'test_suite.questions',
              'test_suite.course_version',
              'test_suite.course_version.course',
              'test',
            ],
          },
        );

        if (!assignment) {
          throw new NotFoundException('Assignment not found');
        }

        if (assignment.status === TestAssignmentStatus.COMPLETED) {
          throw new BadRequestException(
            'This assignment has already been completed',
          );
        }

        const on_going_tests = await transactionalEntityManager.find(Test, {
          where: {
            student: { id: student.id },
            status: In([TestStatusType.ON_GOING, TestStatusType.PAUSED]),
          },
        });

        if (on_going_tests.length) {
          throw new ConflictException('You already have an ongoing test');
        }

        const new_test = new Test();
        new_test.test_suite = assignment.test_suite;
        new_test.student = student;
        new_test.mode = mode;
        new_test.course_id =
          assignment.test_suite?.course_version?.course?.id ?? undefined;

        await transactionalEntityManager.save(new_test);

        assignment.test = new_test;
        await transactionalEntityManager.save(TestAssignment, assignment);

        const time_event = new TimeEvent();
        time_event.recorded_at = new Date();
        time_event.test = new_test;
        await transactionalEntityManager.save(time_event);

        const testId = new_test.id;
        const studentId = student.id;

        const endTime = new Date(
          new Date(time_event.recorded_at).setSeconds(
            (assignment.test_suite.questions.reduce(
              (acc, question) => acc + question.estimated_time_in_ms,
              0,
            ) || 0) / 1000,
          ),
        );

        this.timerService.startTimer(
          testId,
          studentId,
          endTime,
          (remaining_ms) =>
            this.handleTimerTick(testId, studentId, remaining_ms),
          async () => await this.endTest({ id, testId: new_test.id }),
        );

        this.logger.log(
          `Assigned test ${new_test.id} started for student ${studentId}`,
        );

        return new_test;
      },
    );
  }

  async getActiveTest(studentId: string) {
    const student = await this.studentRepository.findOne({
      where: {
        id: studentId,
        tests: {
          status: TestStatusType.ON_GOING || TestStatusType.PAUSED,
        },
      },
      relations: ['tests'],
    });

    return student?.tests[0];
  }

  /**
   * Private helper: Handle timer tick
   */
  private handleTimerTick(
    testId: string,
    studentId: string,
    remainingMs: number,
  ): void {
    this.sseGateway.sendTimeUpdate(testId, studentId, remainingMs);
  }

  private calculateEndTime(
    timeEvents: TimeEvent[],
    totalEstimatedMs: number,
  ): Date {
    const startedEvent = timeEvents.find(
      (e) => e.type === TimeEventType.STARTED,
    );
    const resumedEvent = timeEvents[timeEvents.length - 1];
    const timeUsedMs = this.calculateTimeUsed(timeEvents).getTime();
    if (resumedEvent.type !== TimeEventType.RESUMED) {
      const startTimeMs = new Date(startedEvent.recorded_at).getTime();
      const initialEndTimeMs = startTimeMs + totalEstimatedMs;
      // Calculate active time used
      // End time shifts by the amount of active time used
      const endTimeMs = initialEndTimeMs;
      return new Date(endTimeMs);
    } else {
      const startTimeMs = new Date(resumedEvent.recorded_at).getTime();
      const initialEndTimeMs = startTimeMs + totalEstimatedMs;
      // Calculate active time used
      // End time shifts by the amount of active time used
      const endTimeMs = initialEndTimeMs - timeUsedMs;
      return new Date(endTimeMs);
    }
  }

  private calculateTimeUsed(timeEvents: TimeEvent[]): Date {
    let totalMs = 0;

    // Sort events chronologically
    const sortedEvents = [...timeEvents].sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    );

    // Find the STARTED event
    const startedEvent = sortedEvents.find(
      (e) => e.type === TimeEventType.STARTED,
    );

    let lastActiveTime = new Date(startedEvent.recorded_at).getTime();

    // Process each event chronologically
    for (let i = 1; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];

      const eventTime = new Date(event.recorded_at).getTime();

      if (event.type === TimeEventType.PAUSED) {
        // Add elapsed time until pause
        totalMs += eventTime - lastActiveTime;
        lastActiveTime = 0; // Stop tracking
      } else if (event.type === TimeEventType.RESUMED) {
        // Resume tracking
        lastActiveTime = eventTime;
      }
    }

    // If still active (test was never paused at end), add time until now
    if (lastActiveTime > 0) {
      totalMs += Date.now() - lastActiveTime;
    }

    // Ensure totalMs is never negative
    return new Date(Math.max(0, totalMs));
  }
}
