import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { In, Repository } from 'typeorm';
import { ModuleLoggerRegistry } from 'src/modules/logging/services/module-logger.registry';
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
import { EndTestProducer } from './end-test.producer';
import { MarkAnswerProducer } from './mark-answer.producer';
import { MarkAnswerService } from './mark-answer.service';
import { InsightService } from './insight.service';
import { Course as CourseTypeClass } from '../../inventory/entities/course.entity';
import { SuiteFilterInput } from '../../inventory/inputs';
import { GraphQLError } from 'graphql';

@Injectable()
export class StudentService {
  private readonly log = this.loggerRegistry.getLogger('simulation');

  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(TestAssignment)
    private testAssignmentRepository: Repository<TestAssignment>,
    private endTestProducer: EndTestProducer,
    private markAnswerProducer: MarkAnswerProducer,
    private markAnswerService: MarkAnswerService,
    private insightService: InsightService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly loggerRegistry: ModuleLoggerRegistry,
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
    let scheduledTestId: string;
    let scheduledStudentId: string;
    let scheduledEndTime: Date;

    const new_test = await this.studentRepository.manager.transaction(
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
          throw new GraphQLError('You already have an ongoing test', {
            extensions: { code: 'ONGOING_TEST' },
          });
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

        const endTime = new Date(
          new Date(time_event.recorded_at).setSeconds(
            (student.subscribed_courses[0].versions[0].questions.reduce(
              (acc, question) => acc + question.estimated_time_in_ms,
              0,
            ) || 0) / 1000,
          ),
        );

        scheduledTestId = new_test.id;
        scheduledStudentId = student.id;
        scheduledEndTime = endTime;

        this.log.info(
          { testId: new_test.id, studentId: student.id },
          'simulation.test.started',
        );

        return new_test;
      },
    );

    await this.endTestProducer.scheduleEndTest(
      scheduledTestId,
      scheduledStudentId,
      scheduledEndTime,
    );

    return new_test;
  }

  async pauseTest({ id, testId }: { id: string; testId: string }) {
    const updated_test = await this.studentRepository.manager.transaction(
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

        if (student.tests[0].status !== TestStatusType.ON_GOING) {
          throw new BadRequestException(
            `Cannot pause test with status ${student.tests[0].status}`,
          );
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

        this.log.info(
          { testId: updated_test.id, studentId: student.id },
          'simulation.test.paused',
        );
        return updated_test;
      },
    );

    await this.endTestProducer.cancelEndTestJob(testId);

    return updated_test;
  }

  async resumeTest({ id, testId }: { id: string; testId: string }) {
    let scheduledStudentId: string;
    let scheduledEndTime: Date;

    const updated_test = await this.studentRepository.manager.transaction(
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

        if (student.tests[0].status !== TestStatusType.PAUSED) {
          throw new BadRequestException(
            `Cannot resume test with status ${student.tests[0].status}`,
          );
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

        scheduledStudentId = student.id;
        scheduledEndTime = endTime;

        this.log.info(
          { testId: updated_test.id, studentId: student.id },
          'simulation.test.resumed',
        );

        return updated_test;
      },
    );

    await this.endTestProducer.cancelEndTestJob(testId);
    await this.endTestProducer.scheduleEndTest(
      testId,
      scheduledStudentId,
      scheduledEndTime,
    );

    return updated_test;
  }

  async endTest({ id, testId }: { id: string; testId: string }) {
    const savedTest = await this.endTestInternal({ id, testId });
    await this.endTestProducer.cancelEndTestJob(testId);
    return savedTest;
  }

  /**
   * Invoked by the end-test queue consumer when a test's deadline is
   * reached. Never touches the queue itself, since it is that job.
   */
  async endTestFromQueue({ id, testId }: { id: string; testId: string }) {
    return this.endTestInternal({ id, testId, isQueueTriggered: true });
  }

  private async endTestInternal({
    id,
    testId,
    isQueueTriggered = false,
  }: {
    id: string;
    testId: string;
    isQueueTriggered?: boolean;
  }) {
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

        if (student.tests[0].status === TestStatusType.ENDED) {
          return student.tests[0];
        }

        // A delayed queue job can fire after the student paused the test
        // (e.g. cancellation raced with the job becoming active). Never
        // let the scheduled job end a paused test out from under them.
        if (
          isQueueTriggered &&
          student.tests[0].status === TestStatusType.PAUSED
        ) {
          this.log.info(
            { testId },
            'simulation.end_test.skipped_paused',
          );
          return student.tests[0];
        }

        const time_event = new TimeEvent();
        time_event.recorded_at = new Date();
        time_event.type = TimeEventType.ENDED;
        time_event.test = student.tests[0];
        await transactionalEntityManager.save(time_event);

        student.tests[0].status = TestStatusType.ENDED;

        const studentId = student.id;

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

        this.log.info({ testId, studentId }, 'simulation.test.ended');

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
          throw new GraphQLError(
            "Test has ended, you can't submit answers for an ended test",
            { extensions: { code: 'TEST_ENDED' } },
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
    let scheduledTestId: string;
    let scheduledStudentId: string;
    let scheduledEndTime: Date;

    const new_test = await this.studentRepository.manager.transaction(
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
          throw new GraphQLError('You already have an ongoing test', {
            extensions: { code: 'ONGOING_TEST' },
          });
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

        const endTime = new Date(
          new Date(time_event.recorded_at).setSeconds(
            (assignment.test_suite.questions.reduce(
              (acc, question) => acc + question.estimated_time_in_ms,
              0,
            ) || 0) / 1000,
          ),
        );

        scheduledTestId = new_test.id;
        scheduledStudentId = student.id;
        scheduledEndTime = endTime;

        this.log.info(
          { testId: new_test.id, studentId: student.id },
          'simulation.assigned_test.started',
        );

        return new_test;
      },
    );

    await this.endTestProducer.scheduleEndTest(
      scheduledTestId,
      scheduledStudentId,
      scheduledEndTime,
    );

    return new_test;
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
