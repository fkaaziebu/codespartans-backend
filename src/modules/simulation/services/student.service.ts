import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Student,
  SubmittedAnswer,
  Test,
  TimeEvent,
} from '../../../database/entities';
import { TestStatusType } from '../../../database/types/test.type';
import { TimeEventType } from '../../../database/entities/time_event.entity';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
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

        const new_test = new Test();
        new_test.test_suite =
          student.subscribed_courses[0].versions[0].test_suites[0];
        new_test.student = student;

        await transactionalEntityManager.save(new_test);

        const time_event = new TimeEvent();
        time_event.recorded_at = new Date();
        time_event.test = new_test;
        await transactionalEntityManager.save(time_event);

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
}
