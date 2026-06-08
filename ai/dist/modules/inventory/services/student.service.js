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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const helpers_1 = require("../../../helpers");
const typeorm_2 = require("typeorm");
const organization_entity_1 = require("../../auth/entities/organization.entity");
const student_entity_1 = require("../../auth/entities/student.entity");
const category_entity_1 = require("../entities/category.entity");
const checkout_entity_1 = require("../entities/checkout.entity");
const course_entity_1 = require("../entities/course.entity");
const test_suite_entity_1 = require("../../review/entities/test_suite.entity");
const test_entity_1 = require("../../simulation/entities/test.entity");
const time_event_entity_1 = require("../../simulation/entities/time_event.entity");
const test_entity_2 = require("../../simulation/entities/test.entity");
let StudentService = class StudentService {
    constructor(studentRepository, courseRepository, organizationRepository, categoryRepository, testRepository, testSuiteRepository) {
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.organizationRepository = organizationRepository;
        this.categoryRepository = categoryRepository;
        this.testRepository = testRepository;
        this.testSuiteRepository = testSuiteRepository;
    }
    async getOrganizationCourse({ email, courseId, }) {
        return await this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await this.studentRepository.findOne({
                where: {
                    email,
                },
                relations: ['subscribed_courses', 'cart.courses'],
            });
            if (!student) {
                throw new common_1.NotFoundException('Student not found');
            }
            const course = await transactionalEntityManager.findOne(course_entity_1.Course, {
                where: {
                    id: courseId,
                    organization: {
                        students: {
                            email,
                        },
                    },
                },
                relations: [
                    'approved_version.questions',
                    'approved_version.assigned_admin',
                    'versions.questions',
                    'versions.assigned_admin',
                    'instructor',
                ],
            });
            return {
                ...course,
                is_subscribed: Boolean(student.subscribed_courses.find((crs) => crs.id === course.id)),
                is_course_in_cart: Boolean(student.cart.courses.find((crs) => crs.id === course.id)),
            };
        });
    }
    async listOrganizationCoursesPaginated({ email, organizationId, searchTerm, pagination, filter, }) {
        const courses = await this.listOrganizationCourses({
            email,
            organizationId,
            searchTerm,
            filter,
        });
        return helpers_1.PaginateHelper.paginate(courses, pagination, (course) => course.id.toString());
    }
    async listOrganizationCourses({ email, organizationId, searchTerm, filter, }) {
        const student = await this.studentRepository.findOne({
            where: {
                email,
            },
            relations: ['subscribed_courses'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const courses = await this.courseRepository.find({
            where: {
                organization: {
                    id: organizationId ?? undefined,
                    students: {
                        email,
                    },
                },
                title: searchTerm ? (0, typeorm_2.ILike)(`%${searchTerm.trim()}%`) : undefined,
            },
            relations: [
                'instructor',
                'approved_version.questions',
                'approved_version.test_suites',
            ],
        });
        return courses
            .filter((course) => course.approved_version)
            .map((course) => ({
            ...course,
            is_subscribed: Boolean(student.subscribed_courses.find((crs) => crs.id === course.id)),
            total_questions: course.approved_version.questions.length,
            estimated_duration: course.approved_version.questions.reduce((acc, question) => acc + question.estimated_time_in_ms, 0),
        }))
            .filter((course) => filter ? filter.is_subscribed === course.is_subscribed : true);
    }
    async listCartCourses({ email }) {
        const student = await this.studentRepository.findOne({
            where: {
                email,
            },
            relations: ['cart.courses'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return student.cart.courses || [];
    }
    async listCartCategories({ email }) {
        const student = await this.studentRepository.findOne({
            where: {
                email,
            },
            relations: ['cart.categories'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return student.cart.categories || [];
    }
    async listOrganizationCategories({ email, searchTerm, }) {
        const student = await this.studentRepository.findOne({
            where: {
                email,
            },
            relations: ['organizations'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const organizationEmail = student.organizations.at(0).email;
        const categories = await this.categoryRepository.find({
            where: {
                organization: {
                    email: organizationEmail,
                },
                name: searchTerm ? (0, typeorm_2.ILike)(`%${searchTerm.trim()}%`) : undefined,
            },
            relations: ['courses'],
        });
        return categories;
    }
    async addCourseToCart({ email, courseId, }) {
        return await this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: { email },
                relations: ['cart.courses'],
            });
            if (!student) {
                throw new Error('Student not found');
            }
            const course = await transactionalEntityManager.findOne(course_entity_1.Course, {
                where: {
                    id: courseId,
                    organization: {
                        students: {
                            email,
                        },
                    },
                },
            });
            if (!course) {
                throw new Error('Course not found');
            }
            student.cart.courses.push(course);
            return await transactionalEntityManager.save(student.cart);
        });
    }
    async removeCourseFromCart({ email, courseId, }) {
        return await this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: { email },
                relations: ['cart.courses'],
            });
            if (!student) {
                throw new Error('Student not found');
            }
            student.cart.courses = student.cart.courses.filter((crs) => crs.id !== courseId);
            return await transactionalEntityManager.save(student.cart);
        });
    }
    async addCategoryToCart({ email, categoryId, }) {
        return await this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: { email },
                relations: ['cart.categories'],
            });
            if (!student) {
                throw new Error('Student not found');
            }
            const category = await transactionalEntityManager.findOne(category_entity_1.Category, {
                where: {
                    id: categoryId,
                    organization: {
                        students: {
                            email,
                        },
                    },
                },
                relations: ['courses'],
            });
            if (!category) {
                throw new Error('Category not found');
            }
            student.cart.categories.push(category);
            return await transactionalEntityManager.save(student.cart);
        });
    }
    async createCheckout({ email, courseId, checkoutFromCart, autoApproveSubscription, }) {
        return await this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: { email },
                relations: [
                    'cart.courses',
                    'cart.categories.courses',
                    'subscribed_courses',
                    'subscribed_categories',
                ],
            });
            if (!student) {
                throw new Error('Student not found');
            }
            let courseToSubscribeTo = [];
            const categories = student.cart.categories;
            if (checkoutFromCart && courseId) {
                if (student.cart.courses.some((c) => c.id === courseId)) {
                    courseToSubscribeTo.push(...student.cart.courses, ...student.cart.categories
                        .map((category) => category.courses)
                        .flat()
                        .filter((course) => !student.subscribed_courses
                        .map((crs) => crs.id)
                        .includes(course.id)));
                    courseToSubscribeTo = [
                        ...new Map(courseToSubscribeTo.map((course) => [course.id, course])).values(),
                    ];
                }
                else {
                    const course = await transactionalEntityManager.findOne(course_entity_1.Course, {
                        where: {
                            id: courseId,
                            organization: {
                                students: {
                                    email,
                                },
                            },
                        },
                    });
                    if (!course) {
                        throw new Error('Course not found');
                    }
                    courseToSubscribeTo.push(...student.cart.courses, ...student.cart.categories
                        .map((category) => category.courses)
                        .flat()
                        .filter((course) => !student.subscribed_courses
                        .map((crs) => crs.id)
                        .includes(course.id)), course);
                    courseToSubscribeTo = [
                        ...new Map(courseToSubscribeTo.map((course) => [course.id, course])).values(),
                    ];
                }
                student.cart.courses = [];
                student.cart.categories = [];
            }
            else if (checkoutFromCart) {
                courseToSubscribeTo.push(...student.cart.courses, ...student.cart.categories
                    .map((category) => category.courses)
                    .map((courses) => courses)
                    .flat()
                    .filter((course) => !student.subscribed_courses
                    .map((crs) => crs.id)
                    .includes(course.id)));
                courseToSubscribeTo = [
                    ...new Map(courseToSubscribeTo.map((course) => [course.id, course])).values(),
                ];
                student.cart.courses = [];
                student.cart.categories = [];
            }
            else if (courseId) {
                const course = await transactionalEntityManager.findOne(course_entity_1.Course, {
                    where: {
                        id: courseId,
                        organization: {
                            students: {
                                email,
                            },
                        },
                    },
                });
                if (!course) {
                    throw new Error('Course not found');
                }
                courseToSubscribeTo.push(course);
                student.cart.courses = student.cart.courses.filter((course) => course.id !== courseId);
            }
            else {
                throw new Error('Invalid checkout, you must either checkout from cart or provide a course ID');
            }
            if (autoApproveSubscription) {
                student.subscribed_courses.push(...courseToSubscribeTo);
                student.subscribed_categories.push(...categories);
                await transactionalEntityManager.save(student);
            }
            await transactionalEntityManager.save(student.cart);
            const checkout = new checkout_entity_1.Checkout();
            checkout.student = student;
            checkout.courses = courseToSubscribeTo;
            checkout.categories = categories;
            return await transactionalEntityManager.save(checkout);
        });
    }
    async completeSetup({ email, categoryId, courseIds, }) {
        return await this.studentRepository.manager.transaction(async (transactionalEntityManager) => {
            const student = await transactionalEntityManager.findOne(student_entity_1.Student, {
                where: { email },
                relations: [
                    'cart.courses',
                    'cart.categories.courses',
                    'subscribed_courses',
                    'subscribed_categories',
                ],
            });
            if (!student) {
                throw new Error('Student not found');
            }
            if (student.subscribed_categories.find((cat) => cat.id === categoryId)) {
                throw new common_1.BadRequestException('You have already subscribed to this category');
            }
            const category = await transactionalEntityManager.findOne(category_entity_1.Category, {
                where: {
                    id: categoryId,
                    organization: {
                        students: {
                            email,
                        },
                    },
                },
                relations: ['courses'],
            });
            if (!category) {
                throw new Error('Category not found');
            }
            const subscribedCourseIds = new Set(student.subscribed_courses.map((c) => c.id));
            const newCourses = category.courses.filter((c) => courseIds.includes(c.id) && !subscribedCourseIds.has(c.id));
            student.subscribed_categories.push(category);
            student.subscribed_courses.push(...newCourses);
            student.is_setup_completed = true;
            return await transactionalEntityManager.save(student);
        });
    }
    async listAttempts({ email, searchTerm, filter, pagination, }) {
        const student = await this.studentRepository.findOne({
            where: { email },
            relations: [
                'tests.test_suite.course_version.course',
                'tests.test_suite.questions',
                'tests.submitted_answers.question',
                'tests.time_events',
            ],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const computeScore = (test) => {
            const answers = test.submitted_answers;
            const totalQuestions = test.test_suite?.questions?.length ?? answers.length;
            if (!totalQuestions)
                return 0;
            const correct = answers.filter((a) => a.is_correct === true).length;
            return (correct / totalQuestions) * 100;
        };
        const computeStudyMs = (test) => {
            const events = [...test.time_events].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
            let total = 0;
            let sessionStart = null;
            for (const event of events) {
                if (event.type === time_event_entity_1.TimeEventType.STARTED ||
                    event.type === time_event_entity_1.TimeEventType.RESUMED) {
                    sessionStart = new Date(event.recorded_at);
                }
                else if ((event.type === time_event_entity_1.TimeEventType.PAUSED ||
                    event.type === time_event_entity_1.TimeEventType.ENDED) &&
                    sessionStart) {
                    total +=
                        new Date(event.recorded_at).getTime() - sessionStart.getTime();
                    sessionStart = null;
                }
            }
            return total;
        };
        const endedTests = student.tests.filter((t) => t.status === test_entity_2.TestStatusType.ENDED);
        const enriched = endedTests.map((test) => {
            const answers = test.submitted_answers;
            const correct = answers.filter((a) => a.is_correct === true).length;
            const totalQuestions = test.test_suite?.questions?.length ?? answers.length;
            const wrong = totalQuestions - correct;
            const score = computeScore(test);
            const startEvent = test.time_events.find((e) => e.type === time_event_entity_1.TimeEventType.STARTED);
            const date_taken = startEvent
                ? new Date(startEvent.recorded_at)
                : new Date();
            const time_taken = computeStudyMs(test);
            const course_title = test.test_suite?.course_version?.course?.title ?? '';
            const course_id = test.test_suite?.course_version?.course?.id ?? '';
            return {
                ...test,
                course_title,
                course_id,
                score,
                date_taken,
                correct,
                wrong,
                time_taken,
                trend: null,
            };
        });
        const courseId = (t) => t.test_suite?.course_version?.course?.id;
        for (const attempt of enriched) {
            const cid = courseId(attempt);
            if (!cid || !attempt.date_taken)
                continue;
            const sameCourse = enriched
                .filter((a) => courseId(a) === cid && a.date_taken)
                .sort((a, b) => a.date_taken.getTime() - b.date_taken.getTime());
            const idx = sameCourse.findIndex((a) => a.id === attempt.id);
            if (idx > 0) {
                attempt.trend = attempt.score - sameCourse[idx - 1].score;
            }
        }
        enriched.sort((a, b) => {
            if (!a.date_taken)
                return 1;
            if (!b.date_taken)
                return -1;
            return b.date_taken.getTime() - a.date_taken.getTime();
        });
        let attempts = enriched;
        if (searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            attempts = attempts.filter((t) => {
                return (t.course_title.toLowerCase().includes(term) ||
                    (t.test_suite?.title?.toLowerCase() ?? '').includes(term));
            });
        }
        if (filter?.from || filter?.to) {
            attempts = attempts.filter((t) => {
                if (!t.date_taken)
                    return false;
                if (filter.from && t.date_taken < new Date(filter.from))
                    return false;
                if (filter.to && t.date_taken > new Date(filter.to))
                    return false;
                return true;
            });
        }
        return helpers_1.PaginateHelper.paginate(attempts, pagination, (t) => t.id);
    }
    async getActiveTest({ email }) {
        const student = await this.studentRepository.findOne({
            where: { email },
            relations: [
                'tests.submitted_answers.question',
                'tests.test_suite.questions',
                'tests.test_suite.course_version.course',
                'tests.time_events',
            ],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const activeTest = student.tests.find((t) => t.status === test_entity_2.TestStatusType.ON_GOING ||
            t.status === test_entity_2.TestStatusType.PAUSED);
        if (!activeTest) {
            throw new common_1.NotFoundException('No active test found');
        }
        return {
            ...activeTest,
            course_id: activeTest.test_suite?.course_version?.course?.id ?? null,
        };
    }
    async getTest({ email, testId }) {
        const test = await this.testRepository.findOne({
            where: { id: testId, student: { email } },
            relations: [
                'submitted_answers.question',
                'test_suite.questions',
                'test_suite.course_version.course.categories',
                'time_events',
            ],
        });
        if (!test) {
            throw new common_1.NotFoundException('Test not found');
        }
        const categories = test.test_suite?.course_version?.course?.categories ?? [];
        const course_category = categories.length > 0 ? categories[0].name : null;
        return {
            ...test,
            course_id: test.test_suite?.course_version?.course?.id ?? null,
            course_category,
        };
    }
    async getStats({ email }) {
        const student = await this.studentRepository.findOne({
            where: { email },
            relations: [
                'tests.submitted_answers.question',
                'tests.time_events',
                'tests.test_suite.questions',
            ],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const endedTests = student.tests.filter((t) => t.status === test_entity_2.TestStatusType.ENDED);
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = thisMonthStart;
        const getTestStartTime = (test) => {
            const event = test.time_events.find((e) => e.type === time_event_entity_1.TimeEventType.STARTED);
            return event ? new Date(event.recorded_at) : null;
        };
        const thisMonthTests = endedTests.filter((t) => {
            const start = getTestStartTime(t);
            return start && start >= thisMonthStart;
        });
        const lastMonthTests = endedTests.filter((t) => {
            const start = getTestStartTime(t);
            return start && start >= lastMonthStart && start < lastMonthEnd;
        });
        const computeScore = (test) => {
            const answers = test.submitted_answers;
            const totalQuestions = test.test_suite?.questions?.length ?? answers.length;
            if (!totalQuestions)
                return 0;
            const correct = answers.filter((a) => a.is_correct === true).length;
            return (correct / totalQuestions) * 100;
        };
        const computeAverage = (tests) => {
            if (!tests.length)
                return 0;
            return tests.reduce((sum, t) => sum + computeScore(t), 0) / tests.length;
        };
        const computePercentageChange = (current, previous) => {
            if (previous === 0)
                return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };
        const computeStudyMs = (test) => {
            const events = [...test.time_events].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
            let total = 0;
            let sessionStart = null;
            for (const event of events) {
                if (event.type === time_event_entity_1.TimeEventType.STARTED ||
                    event.type === time_event_entity_1.TimeEventType.RESUMED) {
                    sessionStart = new Date(event.recorded_at);
                }
                else if ((event.type === time_event_entity_1.TimeEventType.PAUSED ||
                    event.type === time_event_entity_1.TimeEventType.ENDED) &&
                    sessionStart) {
                    total +=
                        new Date(event.recorded_at).getTime() - sessionStart.getTime();
                    sessionStart = null;
                }
            }
            return total;
        };
        const thisMonthCount = thisMonthTests.length;
        const lastMonthCount = lastMonthTests.length;
        const thisMonthAvg = computeAverage(thisMonthTests);
        const lastMonthAvg = computeAverage(lastMonthTests);
        const totalStudyMs = endedTests.reduce((sum, t) => sum + computeStudyMs(t), 0);
        const tagErrorCount = new Map();
        for (const test of endedTests) {
            for (const answer of test.submitted_answers) {
                if (answer.is_correct !== true) {
                    for (const tag of answer.question.tags) {
                        tagErrorCount.set(tag, (tagErrorCount.get(tag) ?? 0) + 1);
                    }
                }
            }
        }
        return {
            total_test_taken: endedTests.length,
            total_test_taken_percentage_change: computePercentageChange(thisMonthCount, lastMonthCount),
            average_score: computeAverage(endedTests),
            average_score_percentage_change: computePercentageChange(thisMonthAvg, lastMonthAvg),
            study_hours: totalStudyMs / (1000 * 60 * 60),
            weak_areas_count: tagErrorCount.size,
        };
    }
    async studentSubjectProgress({ email, testId, }) {
        const student = await this.studentRepository.findOne({
            where: { email },
            relations: [
                'tests.submitted_answers',
                'tests.test_suite.course_version.course',
                'tests.test_suite.questions',
                'tests.time_events',
            ],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const RECENT_TEST_CAP = 10;
        let endedTests = student.tests.filter((t) => t.status === test_entity_2.TestStatusType.ENDED);
        if (testId) {
            endedTests = endedTests.filter((t) => t.test_suite?.course_version?.course?.id === testId);
        }
        const recentTests = endedTests
            .map((t) => {
            const startEvent = t.time_events?.find((e) => e.type === time_event_entity_1.TimeEventType.STARTED);
            return { test: t, startedAt: startEvent?.recorded_at ?? new Date(0) };
        })
            .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
            .slice(0, RECENT_TEST_CAP)
            .map((x) => x.test);
        const courseStats = new Map();
        for (const test of recentTests) {
            const courseTitle = test.test_suite?.course_version?.course?.title;
            if (!courseTitle)
                continue;
            const stat = courseStats.get(courseTitle) ?? {
                sessions: 0,
                correct: 0,
                wrong: 0,
                total_questions: 0,
            };
            stat.sessions += 1;
            stat.total_questions +=
                test.test_suite?.questions?.length ?? test.submitted_answers.length;
            for (const answer of test.submitted_answers) {
                if (answer.is_correct === true)
                    stat.correct += 1;
            }
            courseStats.set(courseTitle, stat);
        }
        return Array.from(courseStats.entries()).map(([subject, stat]) => ({
            subject,
            total: stat.sessions,
            correct: stat.correct,
            wrong: stat.total_questions - stat.correct,
            score: stat.total_questions > 0
                ? (stat.correct / stat.total_questions) * 100
                : 0,
        }));
    }
    async studentTestTopicProgress({ email, testId, }) {
        const student = await this.studentRepository.findOne({
            where: { email },
            relations: [
                'tests.submitted_answers.question',
                'tests.test_suite.questions',
            ],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const test = student.tests.find((t) => t.id === testId && t.status === test_entity_2.TestStatusType.ENDED);
        if (!test) {
            throw new common_1.NotFoundException('Test not found or not yet ended');
        }
        const tagStats = new Map();
        const answeredQuestionIds = new Set(test.submitted_answers.map((a) => a.question?.id).filter(Boolean));
        for (const answer of test.submitted_answers) {
            for (const tag of answer.question?.tags ?? []) {
                console.log(answer.question);
                const stat = tagStats.get(tag) ?? { correct: 0, wrong: 0 };
                if (answer.is_correct === true)
                    stat.correct += 1;
                else
                    stat.wrong += 1;
                tagStats.set(tag, stat);
            }
        }
        for (const question of test.test_suite?.questions ?? []) {
            if (answeredQuestionIds.has(question.id))
                continue;
            for (const tag of question.tags ?? []) {
                const stat = tagStats.get(tag) ?? { correct: 0, wrong: 0 };
                stat.wrong += 1;
                tagStats.set(tag, stat);
            }
        }
        return Array.from(tagStats.entries()).map(([topic, stat]) => {
            const total = stat.correct + stat.wrong;
            return {
                topic,
                total,
                correct: stat.correct,
                wrong: stat.wrong,
                score: total > 0 ? (stat.correct / total) * 100 : 0,
            };
        });
    }
    async weakSubjectAreas({ email, testId, }) {
        const student = await this.studentRepository.findOne({
            where: { email },
            relations: [
                'tests.submitted_answers.question',
                'tests.test_suite.questions',
            ],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        let endedTests = student.tests.filter((t) => t.status === test_entity_2.TestStatusType.ENDED);
        if (testId) {
            endedTests = endedTests.filter((t) => t.id === testId);
            if (!endedTests.length) {
                throw new common_1.NotFoundException('Test not found or not yet ended');
            }
        }
        const tagStats = new Map();
        for (const test of endedTests) {
            const answeredQuestionIds = new Set(test.submitted_answers.map((a) => a.question?.id).filter(Boolean));
            for (const answer of test.submitted_answers) {
                const isCorrect = answer.is_correct === true;
                for (const tag of answer.question?.tags ?? []) {
                    const stat = tagStats.get(tag) ?? {
                        error_count: 0,
                        total: 0,
                        questions: new Map(),
                    };
                    stat.total += 1;
                    if (!isCorrect) {
                        stat.error_count += 1;
                        if (answer.question)
                            stat.questions.set(answer.question.id, answer.question);
                    }
                    tagStats.set(tag, stat);
                }
            }
            for (const question of test.test_suite?.questions ?? []) {
                if (answeredQuestionIds.has(question.id))
                    continue;
                for (const tag of question.tags ?? []) {
                    const stat = tagStats.get(tag) ?? {
                        error_count: 0,
                        total: 0,
                        questions: new Map(),
                    };
                    stat.total += 1;
                    stat.error_count += 1;
                    stat.questions.set(question.id, question);
                    tagStats.set(tag, stat);
                }
            }
        }
        return Array.from(tagStats.entries())
            .map(([subject, stat]) => ({
            subject,
            error_count: stat.error_count,
            total: stat.total,
            accuracy: stat.total > 0
                ? ((stat.total - stat.error_count) / stat.total) * 100
                : 100,
            questions: Array.from(stat.questions.values()),
        }))
            .filter((item) => item.accuracy <= 65)
            .sort((a, b) => a.accuracy - b.accuracy);
    }
    async getTestScoreHistory({ email, testId, }) {
        const student = await this.studentRepository.findOne({
            where: { email },
            relations: [
                'tests.submitted_answers.question',
                'tests.time_events',
                'tests.test_suite.course_version.course',
                'tests.test_suite.questions',
            ],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        let testMode;
        let courseId;
        if (testId) {
            const test = student.tests.find((t) => t.id === testId);
            if (!test) {
                throw new common_1.NotFoundException('Test not found');
            }
            testMode = test.mode;
            courseId = test.test_suite?.course_version?.course?.id;
        }
        const endedTests = student.tests.filter((t) => t.status === test_entity_2.TestStatusType.ENDED &&
            (testMode === undefined || t.mode === testMode) &&
            (courseId === undefined ||
                t.test_suite?.course_version?.course?.id === courseId));
        return endedTests
            .map((test) => {
            const answers = test.submitted_answers;
            const correct = answers.filter((a) => a.is_correct === true).length;
            const totalQuestions = test.test_suite?.questions?.length ?? answers.length;
            const score = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
            const startEvent = test.time_events.find((e) => e.type === time_event_entity_1.TimeEventType.STARTED);
            const date_taken = startEvent
                ? new Date(startEvent.recorded_at)
                : new Date();
            const course_title = test.test_suite?.course_version?.course?.title ?? '';
            return {
                test_id: test.id,
                course_title,
                score,
                date_taken,
            };
        })
            .sort((a, b) => b.date_taken.getTime() - a.date_taken.getTime())
            .slice(0, 10);
    }
    async changeStudentPassword({ email, currentPassword, newPassword, }) {
        const student = await this.studentRepository.findOne({ where: { email } });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const isValid = await helpers_1.HashHelper.compare(currentPassword, student.password);
        if (!isValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        student.password = await helpers_1.HashHelper.encrypt(newPassword);
        return await this.studentRepository.save(student);
    }
    async listCourseSuitesPaginated({ email, courseId, suiteTypes, pagination, }) {
        const student = await this.studentRepository.findOne({
            where: { email, subscribed_courses: { id: courseId } },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found or not subscribed to this course');
        }
        const course = await this.courseRepository.findOne({
            where: { id: courseId },
            relations: ['approved_version.test_suites'],
        });
        if (!course?.approved_version) {
            throw new common_1.NotFoundException('Course or approved version not found');
        }
        let suites = course.approved_version.test_suites ?? [];
        if (suiteTypes?.length) {
            suites = suites.filter((s) => suiteTypes.includes(s.suite_type));
        }
        return helpers_1.PaginateHelper.paginate(suites, pagination, (s) => s.id);
    }
    async getCurrentStreakCount({ email, }) {
        const student = await this.studentRepository.findOne({
            where: { email },
            relations: ['tests.time_events'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const endedTests = student.tests.filter((t) => t.status === test_entity_2.TestStatusType.ENDED);
        const getTestStartTime = (test) => {
            const event = test.time_events.find((e) => e.type === time_event_entity_1.TimeEventType.STARTED);
            return event ? new Date(event.recorded_at) : null;
        };
        const { current, best } = this.computeStreaks(endedTests, getTestStartTime);
        return { current_streak: current, best_streak: best };
    }
    computeStreaks(tests, getStartTime) {
        const days = new Set();
        for (const test of tests) {
            const start = getStartTime(test);
            if (start) {
                days.add(start.toISOString().split('T')[0]);
            }
        }
        if (days.size === 0)
            return { current: 0, best: 0 };
        const sortedDays = Array.from(days).sort();
        let bestStreak = 1;
        let runStreak = 1;
        for (let i = 1; i < sortedDays.length; i++) {
            const prev = new Date(sortedDays[i - 1]);
            const curr = new Date(sortedDays[i]);
            const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                runStreak++;
                bestStreak = Math.max(bestStreak, runStreak);
            }
            else {
                runStreak = 1;
            }
        }
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const lastDay = sortedDays[sortedDays.length - 1];
        let currentStreak = 0;
        if (lastDay === todayStr || lastDay === yesterdayStr) {
            currentStreak = 1;
            for (let i = sortedDays.length - 2; i >= 0; i--) {
                const curr = new Date(sortedDays[i + 1]);
                const prev = new Date(sortedDays[i]);
                const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    currentStreak++;
                }
                else {
                    break;
                }
            }
        }
        return { current: currentStreak, best: bestStreak };
    }
};
exports.StudentService = StudentService;
exports.StudentService = StudentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(1, (0, typeorm_1.InjectRepository)(course_entity_1.Course)),
    __param(2, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(3, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(4, (0, typeorm_1.InjectRepository)(test_entity_1.Test)),
    __param(5, (0, typeorm_1.InjectRepository)(test_suite_entity_1.TestSuite)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], StudentService);
//# sourceMappingURL=student.service.js.map