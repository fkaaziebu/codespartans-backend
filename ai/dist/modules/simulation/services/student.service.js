"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var StudentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const student_entity_1 = require("../../auth/entities/student.entity");
const question_entity_1 = require("../../review/entities/question.entity");
const sumitted_answer_entity_1 = require("../entities/sumitted_answer.entity");
const test_entity_1 = require("../entities/test.entity");
const test_assignment_entity_1 = require("../entities/test_assignment.entity");
const time_event_entity_1 = require("../entities/time_event.entity");
const time_event_entity_2 = require("../entities/time_event.entity");
const test_entity_2 = require("../entities/test.entity");
const child_entity_1 = require("../../parent/entities/child.entity");
const student_gateway_1 = require("../gateways/student.gateway");
const test_timer_service_1 = require("./test-timer.service");
const mark_answer_producer_1 = require("./mark-answer.producer");
const mark_answer_service_1 = require("./mark-answer.service");
let StudentService = StudentService_1 = class StudentService {
    constructor(studentRepository, testAssignmentRepository, timerService, sseGateway, markAnswerProducer, markAnswerService) {
        this.studentRepository = studentRepository;
        this.testAssignmentRepository = testAssignmentRepository;
        this.timerService = timerService;
        this.sseGateway = sseGateway;
        this.markAnswerProducer = markAnswerProducer;
        this.markAnswerService = markAnswerService;
        this.logger = new common_1.Logger(StudentService_1.name);
    }
    async startTest({ email, suiteId, mode = test_entity_2.TestModeType.PROCTURED, }) {
        return await this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
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
                relations: [
                    'subscribed_courses.versions.test_suites',
                    'subscribed_courses.versions.questions',
                ],
            });
            if (!student) {
                throw new common_1.NotFoundException('You do not have access to this suite ');
            }
            const on_going_tests = await transactionalEntityManager.find(test_entity_1.Test, {
                where: {
                    student: {
                        id: student.id,
                    },
                    status: (0, typeorm_2.In)([test_entity_2.TestStatusType.ON_GOING, test_entity_2.TestStatusType.PAUSED]),
                },
            });
            if (on_going_tests.length) {
                throw new common_1.ConflictException('You already have an ongoing test');
            }
            const new_test = new test_entity_1.Test();
            new_test.test_suite =
                student.subscribed_courses[0].versions[0].test_suites[0];
            new_test.student = student;
            new_test.mode = mode;
            await transactionalEntityManager.save(new_test);
            const time_event = new time_event_entity_1.TimeEvent();
            time_event.recorded_at = new Date();
            time_event.test = new_test;
            await transactionalEntityManager.save(time_event);
            const testId = new_test.id;
            const studentId = student.id;
            const endTime = new Date(new Date(time_event.recorded_at).setSeconds((student.subscribed_courses[0].versions[0].questions.reduce((acc, question) => acc + question.estimated_time_in_ms, 0) || 0) / 1000));
            this.timerService.startTimer(testId, studentId, endTime, (remaining_ms) => this.handleTimerTick(testId, studentId, remaining_ms), async () => await this.endTest({ email, testId: new_test.id }));
            this.logger.log(`Test ${new_test.id} started for student ${studentId}`);
            return new_test;
        });
    }
    async pauseTest({ email, testId }) {
        return await this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: {
                    email,
                    tests: {
                        id: testId,
                    },
                },
                relations: ['tests.time_events'],
            });
            if (!student) {
                throw new common_1.NotFoundException('You do not have access to this test');
            }
            const time_event = new time_event_entity_1.TimeEvent();
            time_event.recorded_at = new Date();
            time_event.type = time_event_entity_2.TimeEventType.PAUSED;
            time_event.test = student.tests[0];
            await transactionalEntityManager.save(time_event);
            student.tests[0].status = test_entity_2.TestStatusType.PAUSED;
            student.tests[0].time_events.push(time_event);
            const updated_test = await transactionalEntityManager.save(student.tests[0]);
            this.timerService.pauseTimer(testId, student.id);
            this.logger.log(`Test ${updated_test.id} paused for student ${student.id}`);
            return updated_test;
        });
    }
    async resumeTest({ email, testId }) {
        return await this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: {
                    email,
                    tests: {
                        id: testId,
                    },
                },
                relations: ['tests.test_suite.questions', 'tests.time_events'],
            });
            if (!student) {
                throw new common_1.NotFoundException('You do not have access to this test');
            }
            const time_event = new time_event_entity_1.TimeEvent();
            time_event.recorded_at = new Date();
            time_event.type = time_event_entity_2.TimeEventType.RESUMED;
            time_event.test = student.tests[0];
            await transactionalEntityManager.save(time_event);
            student.tests[0].status = test_entity_2.TestStatusType.ON_GOING;
            student.tests[0].time_events.push(time_event);
            const updated_test = await transactionalEntityManager.save(student.tests[0]);
            const totalEstimatedMs = updated_test.test_suite.questions.reduce((acc, question) => acc + question.estimated_time_in_ms, 0) || 0;
            const endTime = this.calculateEndTime(updated_test.time_events, totalEstimatedMs);
            this.timerService.resumeTimer(testId, student.id, endTime, (remainingMs) => this.handleTimerTick(testId, student.id, remainingMs), async () => await this.endTest({ email: student.email, testId }));
            this.logger.log(`Test ${updated_test.id} resumed for student ${student.id}`);
            return updated_test;
        });
    }
    async endTest({ email, testId }) {
        return await this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: {
                    email,
                    tests: {
                        id: testId,
                    },
                },
                relations: ['tests'],
            });
            if (!student) {
                throw new common_1.NotFoundException('You do not have access to this test');
            }
            const time_event = new time_event_entity_1.TimeEvent();
            time_event.recorded_at = new Date();
            time_event.type = time_event_entity_2.TimeEventType.ENDED;
            time_event.test = student.tests[0];
            await transactionalEntityManager.save(time_event);
            student.tests[0].status = test_entity_2.TestStatusType.ENDED;
            const studentId = student.id;
            this.timerService.stopTimer(testId, studentId);
            this.sseGateway.sendTestEnded(testId, studentId);
            const savedTest = await transactionalEntityManager.save(student.tests[0]);
            const linkedAssignment = await transactionalEntityManager.findOne(test_assignment_entity_1.TestAssignment, { where: { test: { id: testId } } });
            if (linkedAssignment) {
                linkedAssignment.status = test_assignment_entity_1.TestAssignmentStatus.COMPLETED;
                linkedAssignment.completed_at = new Date();
                await transactionalEntityManager.save(test_assignment_entity_1.TestAssignment, linkedAssignment);
            }
            this.logger.log(`Test ${testId} ended for student ${studentId}`);
            return savedTest;
        });
    }
    async getQuestion({ email, testId }) {
        return await this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: {
                    email,
                    tests: {
                        id: testId,
                    },
                },
                relations: ['tests.test_suite.questions', 'tests.submitted_answers'],
            });
            if (!student) {
                throw new common_1.NotFoundException('You do not have access to this suite');
            }
            if (student.tests[0].submitted_answers.length ===
                student.tests[0].test_suite.questions.length) {
                throw new common_1.BadRequestException('You have answered all qustions in the suite');
            }
            const unanswered_questions = student.tests[0].test_suite.questions.filter((question) => !student.tests[0].submitted_answers
                .map((answer) => answer.question_id)
                .includes(question.id));
            const random_index = Math.floor(Math.random() * unanswered_questions.length);
            return unanswered_questions[random_index];
        });
    }
    async getSubscribedCourseDetails({ email, courseId, filter, }) {
        return await this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: {
                    email,
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
            const test = await transactionalEntityManager.find(test_entity_1.Test, {
                where: {
                    student: {
                        email: email,
                    },
                    test_suite: (0, typeorm_2.In)(student.subscribed_courses[0].approved_version.test_suites.map((st) => st.id)),
                },
                relations: [
                    'test_suite',
                    'submitted_answers.question',
                    'time_events',
                ],
            });
            const allSuites = student.subscribed_courses[0].approved_version.test_suites;
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
                            .sort((a, b) => new Date(a.time_events.find((e) => e.type === time_event_entity_2.TimeEventType.STARTED).recorded_at).valueOf() -
                            new Date(b.time_events.find((e) => e.type === time_event_entity_2.TimeEventType.STARTED).recorded_at).valueOf()),
                    })),
                },
            };
        });
    }
    async submitAnswer({ email, testId, questionId, timeRange, answer, isFlagged, }) {
        let isNonDeterministic = false;
        let testMode;
        const saved = await this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: {
                    email,
                    tests: {
                        id: testId,
                    },
                },
                relations: ['tests.test_suite.questions', 'tests.submitted_answers'],
            });
            if (!student) {
                throw new common_1.NotFoundException('You do not have access to this suite');
            }
            if (student.tests[0].status === test_entity_2.TestStatusType.ENDED) {
                throw new common_1.BadRequestException("Test has ended, you can't submit answers for an ended test");
            }
            if (student.tests[0].status === test_entity_2.TestStatusType.PAUSED) {
                throw new common_1.BadRequestException('Test is paused, resume to submit answer');
            }
            const question = await transactionalEntityManager.findOne(question_entity_1.Question, {
                where: { id: questionId },
            });
            isNonDeterministic =
                question?.type === question_entity_1.QuestionType.SHORT_ANSWER ||
                    question?.type === question_entity_1.QuestionType.FILL_IN;
            testMode = student.tests[0].mode;
            const existingAnswer = student.tests[0].submitted_answers.find((ans) => ans.question_id === questionId);
            if (existingAnswer) {
                existingAnswer.answer_provided = answer;
                existingAnswer.is_flagged = isFlagged;
                existingAnswer.time_ranges.push(timeRange);
                if (isNonDeterministic) {
                    existingAnswer.is_correct = null;
                    existingAnswer.is_marked = false;
                }
                else {
                    existingAnswer.is_correct = answer === question?.correct_answer;
                    existingAnswer.is_marked = true;
                }
                return await transactionalEntityManager.save(existingAnswer);
            }
            else {
                const newAnswer = new sumitted_answer_entity_1.SubmittedAnswer();
                newAnswer.question_id = questionId;
                newAnswer.answer_provided = answer;
                newAnswer.time_ranges = [timeRange];
                newAnswer.is_flagged = isFlagged;
                newAnswer.test = student.tests[0];
                newAnswer.question = question;
                if (isNonDeterministic) {
                    newAnswer.is_correct = null;
                    newAnswer.is_marked = false;
                }
                else {
                    newAnswer.is_correct = answer === question?.correct_answer;
                    newAnswer.is_marked = true;
                }
                return await transactionalEntityManager.save(newAnswer);
            }
        });
        if (isNonDeterministic) {
            if (testMode === test_entity_2.TestModeType.UN_PROCTURED) {
                return await this.markAnswerService.markShortAnswer(saved.id);
            }
            else {
                await this.markAnswerProducer.markShortAnswer({
                    submittedAnswerId: saved.id,
                });
            }
        }
        return saved;
    }
    async getAllAttemptedQuestions({ email, testId, }) {
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
            throw new common_1.NotFoundException('You do not have access to this suite');
        }
        const test = student.tests[0];
        if (test.status === test_entity_2.TestStatusType.ENDED) {
            throw new common_1.BadRequestException('Test has ended');
        }
        return test.submitted_answers;
    }
    async testStats({ email, testId }) {
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
                'tests.test_suite.questions',
            ],
        });
        if (!student) {
            throw new common_1.NotFoundException('You do not have access to this suite');
        }
        const test = student.tests[0];
        if (test.status !== test_entity_2.TestStatusType.ENDED) {
            throw new common_1.BadRequestException('Test is not ended');
        }
        return test;
    }
    async handleStudentReconnection(testId, studentId) {
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
            throw new common_1.NotFoundException('You do not have access to this suite');
        }
        const test = student.tests[0];
        this.logger.log(`Student ${studentId} reconnected to test ${testId}. Current status: ${test.status}`);
        const totalEstimatedMs = student.tests[0].test_suite.questions.reduce((acc, question) => acc + question.estimated_time_in_ms, 0) || 0;
        const endTime = this.calculateEndTime(test.time_events, totalEstimatedMs);
        const now = new Date();
        const remainingMs = endTime.getTime() - now.getTime();
        if (test.status === test_entity_2.TestStatusType.ON_GOING) {
            if (remainingMs <= 0) {
                this.logger.warn(`Test ${testId} for student ${studentId} has expired. Ending test.`);
                const ended_test = await this.endTest({ email: student.email, testId });
                this.sseGateway.sendTestEnded(testId, studentId);
                return {
                    test: ended_test,
                    action: 'test_ended',
                };
            }
            this.timerService.startTimer(testId, studentId, endTime, (remainingMs) => this.handleTimerTick(testId, studentId, remainingMs), async () => await this.endTest({ email: student.email, testId }));
            this.sseGateway.sendTimeUpdate(testId, studentId, remainingMs);
            return {
                test,
                action: 'test_resumed',
            };
        }
        if (test.status === test_entity_2.TestStatusType.PAUSED && remainingMs) {
            this.sseGateway.sendTestPaused(testId, studentId, remainingMs);
            return {
                test,
                action: 'test_paused',
            };
        }
        if (test.status === test_entity_2.TestStatusType.ENDED) {
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
    async listMyAssignments({ email }) {
        const student = await this.studentRepository.findOne({
            where: { email },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const child = await this.studentRepository.manager.findOne(child_entity_1.Child, {
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
    async startAssignedTest({ email, assignmentId, mode = test_entity_2.TestModeType.PROCTURED, }) {
        return await this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: { email },
            });
            if (!student) {
                throw new common_1.NotFoundException('Student not found');
            }
            const child = await transactionalEntityManager.findOne(child_entity_1.Child, {
                where: { student: { id: student.id } },
            });
            if (!child) {
                throw new common_1.NotFoundException('Child profile not found');
            }
            const assignment = await transactionalEntityManager.findOne(test_assignment_entity_1.TestAssignment, {
                where: { id: assignmentId, child: { id: child.id } },
                relations: [
                    'test_suite.questions',
                    'test_suite.course_version',
                    'test_suite.course_version.course',
                    'test',
                ],
            });
            if (!assignment) {
                throw new common_1.NotFoundException('Assignment not found');
            }
            if (assignment.status === test_assignment_entity_1.TestAssignmentStatus.COMPLETED) {
                throw new common_1.BadRequestException('This assignment has already been completed');
            }
            const on_going_tests = await transactionalEntityManager.find(test_entity_1.Test, {
                where: {
                    student: { id: student.id },
                    status: (0, typeorm_2.In)([test_entity_2.TestStatusType.ON_GOING, test_entity_2.TestStatusType.PAUSED]),
                },
            });
            if (on_going_tests.length) {
                throw new common_1.ConflictException('You already have an ongoing test');
            }
            const new_test = new test_entity_1.Test();
            new_test.test_suite = assignment.test_suite;
            new_test.student = student;
            new_test.mode = mode;
            new_test.course_id =
                assignment.test_suite?.course_version?.course?.id ?? undefined;
            await transactionalEntityManager.save(new_test);
            assignment.test = new_test;
            await transactionalEntityManager.save(test_assignment_entity_1.TestAssignment, assignment);
            const time_event = new time_event_entity_1.TimeEvent();
            time_event.recorded_at = new Date();
            time_event.test = new_test;
            await transactionalEntityManager.save(time_event);
            const testId = new_test.id;
            const studentId = student.id;
            const endTime = new Date(new Date(time_event.recorded_at).setSeconds((assignment.test_suite.questions.reduce((acc, question) => acc + question.estimated_time_in_ms, 0) || 0) / 1000));
            this.timerService.startTimer(testId, studentId, endTime, (remaining_ms) => this.handleTimerTick(testId, studentId, remaining_ms), async () => await this.endTest({ email, testId: new_test.id }));
            this.logger.log(`Assigned test ${new_test.id} started for student ${studentId}`);
            return new_test;
        });
    }
    async getActiveTest(studentId) {
        const student = await this.studentRepository.findOne({
            where: {
                id: studentId,
                tests: {
                    status: test_entity_2.TestStatusType.ON_GOING || test_entity_2.TestStatusType.PAUSED,
                },
            },
            relations: ['tests'],
        });
        return student?.tests[0];
    }
    handleTimerTick(testId, studentId, remainingMs) {
        this.sseGateway.sendTimeUpdate(testId, studentId, remainingMs);
    }
    calculateEndTime(timeEvents, totalEstimatedMs) {
        const startedEvent = timeEvents.find((e) => e.type === time_event_entity_2.TimeEventType.STARTED);
        const resumedEvent = timeEvents[timeEvents.length - 1];
        const timeUsedMs = this.calculateTimeUsed(timeEvents).getTime();
        if (resumedEvent.type !== time_event_entity_2.TimeEventType.RESUMED) {
            const startTimeMs = new Date(startedEvent.recorded_at).getTime();
            const initialEndTimeMs = startTimeMs + totalEstimatedMs;
            const endTimeMs = initialEndTimeMs;
            return new Date(endTimeMs);
        }
        else {
            const startTimeMs = new Date(resumedEvent.recorded_at).getTime();
            const initialEndTimeMs = startTimeMs + totalEstimatedMs;
            const endTimeMs = initialEndTimeMs - timeUsedMs;
            return new Date(endTimeMs);
        }
    }
    calculateTimeUsed(timeEvents) {
        let totalMs = 0;
        const sortedEvents = [...timeEvents].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
        const startedEvent = sortedEvents.find((e) => e.type === time_event_entity_2.TimeEventType.STARTED);
        let lastActiveTime = new Date(startedEvent.recorded_at).getTime();
        for (let i = 1; i < sortedEvents.length; i++) {
            const event = sortedEvents[i];
            const eventTime = new Date(event.recorded_at).getTime();
            if (event.type === time_event_entity_2.TimeEventType.PAUSED) {
                totalMs += eventTime - lastActiveTime;
                lastActiveTime = 0;
            }
            else if (event.type === time_event_entity_2.TimeEventType.RESUMED) {
                lastActiveTime = eventTime;
            }
        }
        if (lastActiveTime > 0) {
            totalMs += Date.now() - lastActiveTime;
        }
        return new Date(Math.max(0, totalMs));
    }
};
exports.StudentService = StudentService;
exports.StudentService = StudentService = StudentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(1, (0, typeorm_1.InjectRepository)(test_assignment_entity_1.TestAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        test_timer_service_1.TestTimerService,
        student_gateway_1.StudentGateway,
        mark_answer_producer_1.MarkAnswerProducer,
        mark_answer_service_1.MarkAnswerService])
], StudentService);
//# sourceMappingURL=student.service.js.map