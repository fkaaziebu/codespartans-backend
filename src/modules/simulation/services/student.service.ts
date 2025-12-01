import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Student,
  SubmittedAnswer,
  Test,
  TimeEvent,
} from '../../../database/entities';
import { TimeEventType } from '../../../database/entities/time_event.entity';
import { TestStatusType } from '../../../database/types/test.type';
import { StudentGateway } from '../gateways/student.gateway';
import { TestTimerService } from './test-timer.service';

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    private timerService: TestTimerService,
    private sseGateway: StudentGateway,
  ) {}

  async startTest({ email, suiteId }: { email: string; suiteId: string }) {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: {
            email,
            subscribed_courses: {
              versions: {
                test_suites: {
                  id: suiteId,
                },
              },
            },
          },
          relations: ['subscribed_courses.versions.test_suites'],
        });

        if (!student) {
          throw new NotFoundException('You do not have access to this suite');
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

        await transactionalEntityManager.save(new_test);

        const time_event = new TimeEvent();
        time_event.recorded_at = new Date();
        time_event.test = new_test;
        await transactionalEntityManager.save(time_event);

        const testId = new_test.id;
        const studentId = student.id;
        const remainingMs = time_event.recorded_at;

        this.timerService.startTimer(
          testId,
          studentId,
          remainingMs,
          (remaining_ms) =>
            this.handleTimerTick(testId, studentId, remaining_ms),
          async () => await this.endTest({ email, testId: new_test.id }),
        );

        this.logger.log(`Test ${new_test.id} started for student ${studentId}`);

        return new_test;
      },
    );
  }

  async pauseTest({ email, testId }: { email: string; testId: string }) {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: {
            email,
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
        time_event.type = TimeEventType.PAUSED;
        time_event.test = student.tests[0];
        await transactionalEntityManager.save(time_event);

        student.tests[0].status = TestStatusType.PAUSED;
        return await transactionalEntityManager.save(student.tests[0]);
      },
    );
  }

  async resumeTest({ email, testId }: { email: string; testId: string }) {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: {
            email,
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
        time_event.type = TimeEventType.RESUMED;
        time_event.test = student.tests[0];
        await transactionalEntityManager.save(time_event);

        student.tests[0].status = TestStatusType.ON_GOING;
        return await transactionalEntityManager.save(student.tests[0]);
      },
    );
  }

  async endTest({ email, testId }: { email: string; testId: string }) {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: {
            email,
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

        this.logger.log(`Test ${testId} ended for student ${studentId}`);
        return await transactionalEntityManager.save(student.tests[0]);
      },
    );
  }

  async getQuestion({ email, testId }: { email: string; testId: string }) {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: {
            email,
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
    email,
    courseId,
  }: {
    email: string;
    courseId: string;
  }) {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: {
            email,
            subscribed_courses: {
              id: courseId,
            },
          },
          relations: [
            'subscribed_courses.approved_version.test_suites.questions',
            'subscribed_courses.instructor',
          ],
        });

        return student.subscribed_courses[0];
      },
    );
  }

  async submitAnswer({
    email,
    testId,
    questionId,
    timeRange,
    answer,
  }: {
    email: string;
    testId: string;
    questionId: string;
    timeRange: string;
    answer: string;
  }) {
    return await this.studentRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const student = await transactionalEntityManager.findOne(Student, {
          where: {
            email,
            tests: {
              id: testId,
            },
          },
          relations: ['tests.test_suite.questions', 'tests.submitted_answers'],
        });

        if (!student) {
          throw new NotFoundException('You do not have access to this suite');
        }

        const existingAnswer = student.tests[0].submitted_answers.find(
          (answer) => answer.question_id === questionId,
        );

        if (existingAnswer) {
          existingAnswer.answer_provided = answer;
          existingAnswer.time_ranges.push(timeRange);
          return await transactionalEntityManager.save(existingAnswer);
        } else {
          const newAnswer = new SubmittedAnswer();
          newAnswer.question_id = questionId;
          newAnswer.answer_provided = answer;
          newAnswer.time_ranges = [timeRange];
          newAnswer.test = student.tests[0];

          await transactionalEntityManager.save(newAnswer);

          return newAnswer;
        }
      },
    );
  }

  async testStats({ email, testId }: { email: string; testId: string }) {
    const student = await this.studentRepository.findOne({
      where: {
        email,
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

    if (test.status !== TestStatusType.ENDED) {
      throw new BadRequestException('Test is not ended');
    }

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
      relations: ['tests.time_events'],
    });

    if (!student) {
      throw new NotFoundException('You do not have access to this suite');
    }

    const test = student.tests[0];

    this.logger.log(
      `Student ${studentId} reconnected to test ${testId}. Current status: ${test.status}`,
    );

    // Check if test is on_going
    if (test.status === TestStatusType.ON_GOING) {
      const remainingTime = this.timerService.getRemainingTime(
        test.time_events.find((e) => e.type === TimeEventType.STARTED)
          .recorded_at,
      );

      // Critical: Check if test should have ended
      if (remainingTime <= 0) {
        this.logger.warn(
          `Test ${testId} for student ${studentId} has expired. Ending test.`,
        );

        const ended_test = await this.endTest({ email: student.email, testId });

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
        test.time_events.filter(
          (e) =>
            e.type === TimeEventType.RESUMED ||
            e.type === TimeEventType.STARTED,
        )[
          test.time_events.filter(
            (e) =>
              e.type === TimeEventType.RESUMED ||
              e.type === TimeEventType.STARTED,
          ).length - 1
        ].recorded_at,
        (remainingMs) => this.handleTimerTick(testId, studentId, remainingMs),
        async () => await this.endTest({ email: student.email, testId }),
      );

      // Send current remaining time to student
      this.sseGateway.sendTimeUpdate(testId, studentId, remainingTime);

      return {
        test,
        action: 'test_resumed',
      };
    }

    // Test is paused, send current remaining time
    if (
      test.status === TestStatusType.PAUSED &&
      this.timerService.getRemainingTime(
        test.time_events.find((e) => e.type === TimeEventType.STARTED)
          .recorded_at,
      )
    ) {
      this.sseGateway.sendTestPaused(
        testId,
        studentId,
        this.timerService.getRemainingTime(
          test.time_events.find((e) => e.type === TimeEventType.STARTED)
            .recorded_at,
        ),
      );
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
}
