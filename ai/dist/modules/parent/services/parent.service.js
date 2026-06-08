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
exports.ParentService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const helpers_1 = require("../../../helpers");
const time_event_entity_1 = require("../../simulation/entities/time_event.entity");
const test_entity_1 = require("../../simulation/entities/test.entity");
const test_assignment_entity_1 = require("../../simulation/entities/test_assignment.entity");
const test_suite_entity_1 = require("../../review/entities/test_suite.entity");
const student_entity_1 = require("../../auth/entities/student.entity");
const organization_entity_1 = require("../../auth/entities/organization.entity");
const cart_entity_1 = require("../../inventory/entities/cart.entity");
const category_entity_1 = require("../../inventory/entities/category.entity");
const uuid_1 = require("uuid");
const email_producer_1 = require("../../auth/services/email.producer");
const signup_producer_1 = require("../../auth/services/signup.producer");
const child_entity_1 = require("../entities/child.entity");
const parent_entity_1 = require("../entities/parent.entity");
let ParentService = class ParentService {
    constructor(parentRepository, childRepository, categoryRepository, testAssignmentRepository, testSuiteRepository, jwtService, configService, emailProducer, signupProducer) {
        this.parentRepository = parentRepository;
        this.childRepository = childRepository;
        this.categoryRepository = categoryRepository;
        this.testAssignmentRepository = testAssignmentRepository;
        this.testSuiteRepository = testSuiteRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.emailProducer = emailProducer;
        this.signupProducer = signupProducer;
    }
    async registerParent({ first_name, last_name, email, whatsapp_number, password, gender, }) {
        return this.parentRepository.manager.transaction(async (transactionalEntityManager) => {
            const existing = await transactionalEntityManager.findOne(parent_entity_1.Parent, {
                where: { email },
            });
            if (existing) {
                throw new common_1.BadRequestException('An account with this email already exists');
            }
            const validationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const parent = new parent_entity_1.Parent();
            parent.first_name = first_name;
            parent.last_name = last_name;
            parent.email = email;
            parent.whatsapp_number = whatsapp_number;
            parent.password = await helpers_1.HashHelper.encrypt(password);
            parent.gender = gender ?? parent_entity_1.Gender.Male;
            parent.is_account_validated = false;
            parent.is_setup_completed = false;
            parent.validation_code = validationCode;
            await transactionalEntityManager.save(parent_entity_1.Parent, parent);
            await this.emailProducer.sendAccountValidationEmail({
                email,
                name: `${first_name} ${last_name}`,
                validationCode,
            });
            return {
                message: 'Registration successful. Please verify your email.',
            };
        });
    }
    async refreshParentToken(refresh_token) {
        let payload;
        try {
            payload = this.jwtService.verify(refresh_token);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        if (payload.type !== 'refresh' || payload.role !== 'PARENT') {
            throw new common_1.UnauthorizedException('Invalid token type');
        }
        const { type: _type, iat: _iat, exp: _exp, ...tokenPayload } = payload;
        const access_token = this.jwtService.sign(tokenPayload);
        return { access_token };
    }
    async resendParentAccountValidationCode(email) {
        return this.parentRepository.manager.transaction(async (transactionalEntityManager) => {
            const parent = await transactionalEntityManager.findOne(parent_entity_1.Parent, {
                where: { email },
            });
            if (!parent) {
                throw new common_1.NotFoundException('Parent not found');
            }
            if (parent.is_account_validated) {
                throw new common_1.BadRequestException('Account is already verified');
            }
            const validationCode = Math.floor(100000 + Math.random() * 900000).toString();
            parent.validation_code = validationCode;
            await transactionalEntityManager.save(parent_entity_1.Parent, parent);
            await this.emailProducer.sendAccountValidationEmail({
                email,
                name: `${parent.first_name} ${parent.last_name}`,
                validationCode,
            });
            return { message: 'Verification email resent successfully' };
        });
    }
    async verifyParentAccount({ email, code, }) {
        return this.parentRepository.manager.transaction(async (transactionalEntityManager) => {
            const parent = await transactionalEntityManager.findOne(parent_entity_1.Parent, {
                where: { email },
            });
            if (!parent) {
                throw new common_1.NotFoundException('Parent not found');
            }
            if (parent.is_account_validated) {
                throw new common_1.BadRequestException('Account is already verified');
            }
            if (parent.validation_code !== code) {
                throw new common_1.BadRequestException('Invalid verification code');
            }
            parent.is_account_validated = true;
            parent.validation_code = null;
            await transactionalEntityManager.save(parent_entity_1.Parent, parent);
            await this.signupProducer.enqueueFreeTrial({ email, role: 'PARENT' });
            return { message: 'Account verified successfully' };
        });
    }
    async loginParent({ email, password, }) {
        return this.parentRepository.manager.transaction(async (transactionalEntityManager) => {
            const parent = await transactionalEntityManager.findOne(parent_entity_1.Parent, {
                where: { email },
            });
            if (!parent) {
                throw new common_1.BadRequestException('Email or password is incorrect');
            }
            const isPasswordValid = await helpers_1.HashHelper.compare(password, parent.password);
            if (!isPasswordValid) {
                throw new common_1.BadRequestException('Email or password is incorrect');
            }
            if (!parent.is_account_validated) {
                throw new common_1.BadRequestException('Account not verified. Please check your email for the verification code.');
            }
            const payload = {
                id: parent.id,
                name: `${parent.first_name} ${parent.last_name}`,
                email: parent.email,
                role: 'PARENT',
            };
            const token = this.jwtService.sign(payload);
            const refresh_token = this.jwtService.sign({ ...payload, type: 'refresh' }, { expiresIn: '30d' });
            return { ...parent, token, refresh_token };
        });
    }
    async requestParentPasswordReset({ email }) {
        return this.parentRepository.manager.transaction(async (transactionalEntityManager) => {
            const parent = await transactionalEntityManager.findOne(parent_entity_1.Parent, {
                where: { email },
            });
            if (!parent) {
                return { message: 'Password reset link sent to your email' };
            }
            const resetCode = (0, uuid_1.v4)();
            parent.reset_token = resetCode;
            await transactionalEntityManager.save(parent);
            await this.emailProducer.sendParentPasswordResetEmail({
                email,
                name: `${parent.first_name} ${parent.last_name}`,
                resetCode,
            });
            return { message: 'Password reset link sent to your email' };
        });
    }
    async resetParentPassword({ email, password, token, }) {
        return this.parentRepository.manager.transaction(async (transactionalEntityManager) => {
            const parent = await transactionalEntityManager.findOne(parent_entity_1.Parent, {
                where: { email },
            });
            if (!parent || parent.reset_token !== token) {
                throw new common_1.BadRequestException('Invalid password reset details');
            }
            parent.reset_token = '';
            parent.password = await helpers_1.HashHelper.encrypt(password);
            await transactionalEntityManager.save(parent);
            return { message: 'Password reset is successful' };
        });
    }
    async setupParentAccount(parentEmail, children) {
        return this.parentRepository.manager.transaction(async (transactionalEntityManager) => {
            const parent = await transactionalEntityManager.findOne(parent_entity_1.Parent, {
                where: { email: parentEmail },
            });
            if (!parent) {
                throw new common_1.NotFoundException('Parent not found');
            }
            if (!parent.is_account_validated) {
                throw new common_1.UnauthorizedException('Please verify your account before setting up');
            }
            const results = [];
            for (const childData of children) {
                const category = await transactionalEntityManager.findOne(category_entity_1.Category, {
                    where: { id: childData.target_exam },
                    relations: ['courses'],
                });
                if (!category) {
                    throw new common_1.NotFoundException(`Category with id ${childData.target_exam} not found`);
                }
                const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
                const username = await this.generateUniqueUsername(childData.full_name, transactionalEntityManager);
                const organization = await transactionalEntityManager.findOne(organization_entity_1.Organization, { where: { email: this.configService.get('GENPOP_EMAIL') } });
                if (!organization) {
                    throw new common_1.NotFoundException('Default organization not found');
                }
                const cart = new cart_entity_1.Cart();
                await transactionalEntityManager.save(cart_entity_1.Cart, cart);
                const student = new student_entity_1.Student();
                student.name = childData.full_name;
                student.email = `${username}@child.local`;
                student.password = await helpers_1.HashHelper.encrypt(rawPin);
                student.is_account_validated = true;
                student.is_setup_completed = true;
                student.cart = cart;
                student.organizations = [organization];
                student.subscribed_categories = [category];
                student.subscribed_courses = category.courses ?? [];
                await transactionalEntityManager.save(student);
                const child = new child_entity_1.Child();
                child.full_name = childData.full_name;
                child.class_level = childData.class_level;
                child.target_exam = childData.target_exam;
                child.school_name = childData.school_name;
                child.username = username;
                child.pin = await helpers_1.HashHelper.encrypt(rawPin);
                child.parent = parent;
                child.student = student;
                await transactionalEntityManager.save(child);
                results.push({
                    full_name: childData.full_name,
                    username,
                    pin: rawPin,
                });
            }
            parent.is_setup_completed = true;
            await transactionalEntityManager.save(parent);
            return results;
        });
    }
    async addChild(parentEmail, { full_name, class_level, target_exam, school_name, }) {
        return this.parentRepository.manager.transaction(async (transactionalEntityManager) => {
            const parent = await transactionalEntityManager.findOne(parent_entity_1.Parent, {
                where: { email: parentEmail },
            });
            if (!parent) {
                throw new common_1.NotFoundException('Parent not found');
            }
            if (!parent.is_account_validated) {
                throw new common_1.UnauthorizedException('Please verify your account before adding children');
            }
            const category = await transactionalEntityManager.findOne(category_entity_1.Category, {
                where: { id: target_exam },
                relations: ['courses'],
            });
            if (!category) {
                throw new common_1.NotFoundException(`Category with id ${target_exam} not found`);
            }
            const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
            const username = await this.generateUniqueUsername(full_name, transactionalEntityManager);
            const organization = await transactionalEntityManager.findOne(organization_entity_1.Organization, { where: { email: this.configService.get('GENPOP_EMAIL') } });
            if (!organization) {
                throw new common_1.NotFoundException('Default organization not found');
            }
            const cart = new cart_entity_1.Cart();
            await transactionalEntityManager.save(cart_entity_1.Cart, cart);
            const student = new student_entity_1.Student();
            student.name = full_name;
            student.email = `${username}@child.local`;
            student.password = await helpers_1.HashHelper.encrypt(rawPin);
            student.is_account_validated = true;
            student.is_setup_completed = true;
            student.cart = cart;
            student.organizations = [organization];
            student.subscribed_categories = [category];
            student.subscribed_courses = category.courses ?? [];
            await transactionalEntityManager.save(student_entity_1.Student, student);
            const child = new child_entity_1.Child();
            child.full_name = full_name;
            child.class_level = class_level;
            child.target_exam = target_exam;
            child.school_name = school_name;
            child.username = username;
            child.pin = await helpers_1.HashHelper.encrypt(rawPin);
            child.parent = parent;
            child.student = student;
            await transactionalEntityManager.save(child_entity_1.Child, child);
            return {
                message: 'Child added successfully',
                pin: rawPin,
            };
        });
    }
    async resetChildPin(parentEmail, childId) {
        return this.parentRepository.manager.transaction(async (transactionalEntityManager) => {
            const child = await transactionalEntityManager.findOne(child_entity_1.Child, {
                where: { id: childId, parent: { email: parentEmail } },
                relations: ['student'],
            });
            if (!child) {
                throw new common_1.NotFoundException('Child not found');
            }
            const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
            const hashed = await helpers_1.HashHelper.encrypt(rawPin);
            child.pin = hashed;
            await transactionalEntityManager.save(child_entity_1.Child, child);
            if (child.student) {
                child.student.password = hashed;
                await transactionalEntityManager.save(student_entity_1.Student, child.student);
            }
            return { message: 'Pin reset successfully', pin: rawPin };
        });
    }
    async shareChildLogin(parentEmail, childId) {
        return this.childRepository.manager.transaction(async (transactionalEntityManager) => {
            const child = await transactionalEntityManager.findOne(child_entity_1.Child, {
                where: { id: childId, parent: { email: parentEmail } },
                relations: ['student'],
            });
            if (!child) {
                throw new common_1.NotFoundException('Child not found');
            }
            const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
            const hashed = await helpers_1.HashHelper.encrypt(rawPin);
            child.pin = hashed;
            await transactionalEntityManager.save(child_entity_1.Child, child);
            if (child.student) {
                child.student.password = hashed;
                await transactionalEntityManager.save(student_entity_1.Student, child.student);
            }
            const studentUrl = this.configService.get('STUDENT_URL', 'http://localhost:3000');
            const message = `Hi! Here are ${child.full_name}'s ExamForge login details: Username: ${child.username} PIN: ${rawPin} Login at: ${studentUrl}/child-login`;
            return { message };
        });
    }
    async listOrganizationCategories(searchTerm) {
        return this.categoryRepository.find({
            where: {
                organization: {
                    email: this.configService.get('GENPOP_EMAIL'),
                },
                ...(searchTerm ? { name: (0, typeorm_2.ILike)(`%${searchTerm.trim()}%`) } : {}),
            },
            relations: ['courses.approved_version.test_suites'],
        });
    }
    async listChildren(parentEmail, pagination) {
        return this.parentRepository.manager.transaction(async (transactionalEntityManager) => {
            const parent = await transactionalEntityManager.findOne(parent_entity_1.Parent, {
                where: { email: parentEmail },
                relations: ['children.student.subscribed_categories'],
            });
            if (!parent) {
                throw new common_1.NotFoundException('Parent not found');
            }
            return helpers_1.PaginateHelper.paginate(parent.children, pagination, (child) => child.id);
        });
    }
    async getChildStats(parentEmail, childId) {
        const child = await this.childRepository.findOne({
            where: { id: childId, parent: { email: parentEmail } },
            relations: [
                'student.tests.submitted_answers.question',
                'student.tests.time_events',
            ],
        });
        if (!child) {
            throw new common_1.NotFoundException('Child not found');
        }
        if (!child.student) {
            return {
                avg_score: 0,
                avg_score_percent_diff: 0,
                current_streak_count: 0,
                best_streak_count: 0,
                total_questions_done: 0,
                total_questions_percent_diff: 0,
                sessions_this_week: 0,
            };
        }
        const endedTests = child.student.tests.filter((t) => t.status === test_entity_1.TestStatusType.ENDED);
        const getTestStartTime = (test) => {
            const event = test.time_events.find((e) => e.type === time_event_entity_1.TimeEventType.STARTED);
            return event ? new Date(event.recorded_at) : null;
        };
        const computeScore = (test) => {
            const answers = test.submitted_answers;
            if (!answers.length)
                return 0;
            const correct = answers.filter((a) => a.is_correct === true).length;
            return (correct / answers.length) * 100;
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
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = thisMonthStart;
        const thisWeekStart = new Date(now);
        thisWeekStart.setDate(now.getDate() - now.getDay());
        thisWeekStart.setHours(0, 0, 0, 0);
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = thisWeekStart;
        const thisMonthTests = endedTests.filter((t) => {
            const start = getTestStartTime(t);
            return start && start >= thisMonthStart;
        });
        const lastMonthTests = endedTests.filter((t) => {
            const start = getTestStartTime(t);
            return start && start >= lastMonthStart && start < lastMonthEnd;
        });
        const thisWeekTests = endedTests.filter((t) => {
            const start = getTestStartTime(t);
            return start && start >= thisWeekStart;
        });
        const lastWeekTests = endedTests.filter((t) => {
            const start = getTestStartTime(t);
            return start && start >= lastWeekStart && start < lastWeekEnd;
        });
        const thisWeekQuestions = thisWeekTests.reduce((sum, t) => sum + t.submitted_answers.length, 0);
        const lastWeekQuestions = lastWeekTests.reduce((sum, t) => sum + t.submitted_answers.length, 0);
        const { current, best } = this.computeStreaks(endedTests, getTestStartTime);
        return {
            avg_score: computeAverage(endedTests),
            avg_score_percent_diff: computePercentageChange(computeAverage(thisMonthTests), computeAverage(lastMonthTests)),
            current_streak_count: current,
            best_streak_count: best,
            total_questions_done: endedTests.reduce((sum, t) => sum + t.submitted_answers.length, 0),
            total_questions_percent_diff: computePercentageChange(thisWeekQuestions, lastWeekQuestions),
            sessions_this_week: thisWeekTests.length,
        };
    }
    async getChildSubjectProgress(parentEmail, childId, courseId) {
        const child = await this.childRepository.findOne({
            where: { id: childId, parent: { email: parentEmail } },
            relations: [
                'student.tests.submitted_answers',
                'student.tests.test_suite.course_version.course',
                'student.tests.time_events',
            ],
        });
        if (!child) {
            throw new common_1.NotFoundException('Child not found');
        }
        if (!child.student)
            return [];
        const RECENT_TEST_CAP = 10;
        const endedTests = child.student.tests.filter((t) => {
            if (t.status !== test_entity_1.TestStatusType.ENDED)
                return false;
            if (courseId) {
                return t.test_suite?.course_version?.course?.id === courseId;
            }
            return true;
        });
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
            };
            stat.sessions += 1;
            for (const answer of test.submitted_answers) {
                if (answer.is_correct === true)
                    stat.correct += 1;
                else
                    stat.wrong += 1;
            }
            courseStats.set(courseTitle, stat);
        }
        return Array.from(courseStats.entries()).map(([subject, stat]) => {
            const totalAnswers = stat.correct + stat.wrong;
            return {
                subject,
                total: stat.sessions,
                correct: stat.correct,
                wrong: stat.wrong,
                score: totalAnswers > 0 ? (stat.correct / totalAnswers) * 100 : 0,
            };
        });
    }
    async getChildTestsHistory(parentEmail, childId, pagination) {
        const child = await this.childRepository.findOne({
            where: { id: childId, parent: { email: parentEmail } },
            relations: [
                'student.tests.test_suite.course_version.course',
                'student.tests.submitted_answers.question',
                'student.tests.time_events',
            ],
        });
        if (!child) {
            throw new common_1.NotFoundException('Child not found');
        }
        if (!child.student) {
            return helpers_1.PaginateHelper.paginate([], pagination, (t) => t.id);
        }
        const endedTests = child.student.tests.filter((t) => t.status === test_entity_1.TestStatusType.ENDED);
        const computeScore = (test) => {
            const answers = test.submitted_answers;
            if (!answers.length)
                return 0;
            const correct = answers.filter((a) => a.is_correct === true).length;
            return (correct / answers.length) * 100;
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
        const enriched = endedTests.map((test) => {
            const answers = test.submitted_answers;
            const correct = answers.filter((a) => a.is_correct === true).length;
            const wrong = answers.length - correct;
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
        const getCourseId = (t) => t.test_suite?.course_version?.course?.id;
        for (const attempt of enriched) {
            const cid = getCourseId(attempt);
            if (!cid || !attempt.date_taken)
                continue;
            const sameCourse = enriched
                .filter((a) => getCourseId(a) === cid && a.date_taken)
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
        return helpers_1.PaginateHelper.paginate(enriched, pagination, (t) => t.id);
    }
    async getChildWeakAreas(parentEmail, childId) {
        const child = await this.childRepository.findOne({
            where: { id: childId, parent: { email: parentEmail } },
            relations: [
                'student.tests.submitted_answers.question',
                'student.tests.test_suite.questions',
                'student.tests.time_events',
            ],
        });
        if (!child) {
            throw new common_1.NotFoundException('Child not found');
        }
        if (!child.student)
            return [];
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        const endedTests = child.student.tests.filter((t) => {
            if (t.status !== test_entity_1.TestStatusType.ENDED)
                return false;
            const startEvent = t.time_events?.find((e) => e.type === time_event_entity_1.TimeEventType.STARTED);
            if (!startEvent)
                return false;
            return new Date(startEvent.recorded_at) >= fourWeeksAgo;
        });
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
                        if (answer.question) {
                            stat.questions.set(answer.question.id, answer.question);
                        }
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
    async getChildActivity(parentEmail, childId, pagination) {
        const child = await this.childRepository.findOne({
            where: { id: childId, parent: { email: parentEmail } },
            relations: [
                'student.tests.submitted_answers.question',
                'student.tests.time_events',
                'student.tests.test_suite.course_version.course',
            ],
        });
        if (!child) {
            throw new common_1.NotFoundException('Child not found');
        }
        if (!child.student) {
            return helpers_1.PaginateHelper.paginate([], pagination, (a) => a.activity_date.toISOString());
        }
        const endedTests = child.student.tests.filter((t) => t.status === test_entity_1.TestStatusType.ENDED);
        const activities = endedTests
            .map((test) => {
            const startEvent = test.time_events.find((e) => e.type === time_event_entity_1.TimeEventType.STARTED);
            if (!startEvent)
                return null;
            const answers = test.submitted_answers;
            const correct = answers.filter((a) => a.is_correct === true).length;
            const score = answers.length > 0 ? (correct / answers.length) * 100 : 0;
            const course_title = test.test_suite?.course_version?.course?.title ?? undefined;
            return {
                activity_date: new Date(startEvent.recorded_at),
                score,
                questions_done: answers.length,
                course_title,
            };
        })
            .filter(Boolean)
            .sort((a, b) => b.activity_date.getTime() - a.activity_date.getTime());
        return helpers_1.PaginateHelper.paginate(activities, pagination, (a) => a.activity_date.toISOString());
    }
    async getChildStreak(parentEmail, childId) {
        const child = await this.childRepository.findOne({
            where: { id: childId, parent: { email: parentEmail } },
            relations: ['student.tests.time_events'],
        });
        if (!child) {
            throw new common_1.NotFoundException('Child not found');
        }
        if (!child.student) {
            return { current_streak: 0, best_streak: 0 };
        }
        const endedTests = child.student.tests.filter((t) => t.status === test_entity_1.TestStatusType.ENDED);
        const getTestStartTime = (test) => {
            const event = test.time_events.find((e) => e.type === time_event_entity_1.TimeEventType.STARTED);
            return event ? new Date(event.recorded_at) : null;
        };
        const { current, best } = this.computeStreaks(endedTests, getTestStartTime);
        return { current_streak: current, best_streak: best };
    }
    async listChildStreak(parentEmail, childId, month, year) {
        const child = await this.childRepository.findOne({
            where: { id: childId, parent: { email: parentEmail } },
            relations: ['student.tests.time_events'],
        });
        if (!child) {
            throw new common_1.NotFoundException('Child not found');
        }
        const dateCounts = new Map();
        if (child.student) {
            const endedTests = child.student.tests.filter((t) => t.status === test_entity_1.TestStatusType.ENDED);
            for (const test of endedTests) {
                const event = test.time_events.find((e) => e.type === time_event_entity_1.TimeEventType.STARTED);
                if (!event)
                    continue;
                const d = new Date(event.recorded_at);
                if (d.getFullYear() === year && d.getMonth() + 1 === month) {
                    const dateStr = d.toISOString().split('T')[0];
                    dateCounts.set(dateStr, (dateCounts.get(dateStr) ?? 0) + 1);
                }
            }
        }
        const daysInMonth = new Date(year, month, 0).getDate();
        const result = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const count = dateCounts.get(date) ?? 0;
            result.push({ date, is_active: count > 0, count });
        }
        return result;
    }
    async verifyChildUsername(username) {
        const child = await this.childRepository.findOne({ where: { username } });
        if (!child) {
            throw new common_1.NotFoundException('Username not found');
        }
        const payload = {
            id: child.id,
            username: child.username,
            role: 'CHILD',
            type: 'temp',
        };
        const temp_token = this.jwtService.sign(payload, { expiresIn: '5m' });
        return { temp_token };
    }
    async loginChild(temp_token, pin) {
        let payload;
        try {
            payload = this.jwtService.verify(temp_token);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
        if (payload.type !== 'temp' || payload.role !== 'CHILD') {
            throw new common_1.UnauthorizedException('Invalid token type');
        }
        const child = await this.childRepository.findOne({
            where: { id: payload.id },
            relations: ['student.organizations'],
        });
        if (!child) {
            throw new common_1.NotFoundException('Child not found');
        }
        const isPinValid = await helpers_1.HashHelper.compare(pin, child.pin);
        if (!isPinValid) {
            throw new common_1.UnauthorizedException('Invalid pin');
        }
        const tokenPayload = {
            id: child.student.id,
            name: child.student.name,
            email: child.student.email,
            role: 'CHILD',
        };
        const token = this.jwtService.sign(tokenPayload);
        const refresh_token = this.jwtService.sign({ ...tokenPayload, type: 'refresh' }, { expiresIn: '30d' });
        return { ...child, token, refresh_token };
    }
    async assignTestToChild(parentEmail, childId, suiteId, note) {
        return this.parentRepository.manager.transaction(async (transactionalEntityManager) => {
            const child = await transactionalEntityManager.findOne(child_entity_1.Child, {
                where: { id: childId, parent: { email: parentEmail } },
                relations: ['parent'],
            });
            if (!child) {
                throw new common_1.NotFoundException('Child not found');
            }
            const testSuite = await transactionalEntityManager.findOne(test_suite_entity_1.TestSuite, {
                where: { id: suiteId },
            });
            if (!testSuite) {
                throw new common_1.NotFoundException('Test suite not found');
            }
            const assignment = new test_assignment_entity_1.TestAssignment();
            assignment.parent = child.parent;
            assignment.child = child;
            assignment.test_suite = testSuite;
            assignment.status = test_assignment_entity_1.TestAssignmentStatus.PENDING;
            if (note)
                assignment.note = note;
            return transactionalEntityManager.save(test_assignment_entity_1.TestAssignment, assignment);
        });
    }
    async listChildCourses(parentEmail, childId) {
        const child = await this.childRepository.findOne({
            where: { id: childId, parent: { email: parentEmail } },
            relations: [
                'student',
                'student.subscribed_courses',
                'student.subscribed_courses.approved_version',
                'student.subscribed_courses.approved_version.test_suites',
                'student.subscribed_courses.approved_version.test_suites.questions',
            ],
        });
        if (!child)
            throw new common_1.NotFoundException('Child not found');
        return child.student?.subscribed_courses ?? [];
    }
    async listChildAssignments(parentEmail, childId) {
        const child = await this.childRepository.findOne({
            where: { id: childId, parent: { email: parentEmail } },
        });
        if (!child) {
            throw new common_1.NotFoundException('Child not found');
        }
        return this.testAssignmentRepository.find({
            where: { child: { id: childId } },
            relations: ['test_suite', 'test'],
            order: { assigned_at: 'DESC' },
        });
    }
    async listParentAlerts(parentEmail) {
        const parent = await this.parentRepository.findOne({
            where: { email: parentEmail },
            relations: [
                'children.student.tests.submitted_answers.question',
                'children.student.tests.time_events',
                'children.student.tests.test_suite.course_version.course',
            ],
        });
        if (!parent)
            throw new common_1.NotFoundException('Parent not found');
        const now = new Date();
        const alerts = [];
        const formatTimeLabel = (date) => {
            const diffMs = now.getTime() - date.getTime();
            const diffH = Math.floor(diffMs / (1000 * 60 * 60));
            const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            if (diffH < 1)
                return 'Just now';
            if (diffH < 24)
                return `${diffH} hour${diffH > 1 ? 's' : ''} ago`;
            if (diffD === 1) {
                const hhmm = date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                });
                return `Yesterday, ${hhmm}`;
            }
            return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        };
        const getTestStartTime = (test) => {
            const event = test.time_events.find((e) => e.type === time_event_entity_1.TimeEventType.STARTED);
            return event ? new Date(event.recorded_at) : null;
        };
        const computeScore = (test) => {
            const answers = test.submitted_answers;
            if (!answers.length)
                return 0;
            return ((answers.filter((a) => a.is_correct === true).length / answers.length) *
                100);
        };
        for (const child of parent.children) {
            const firstName = child.full_name.split(' ')[0];
            const endedTests = (child.student?.tests ?? []).filter((t) => t.status === test_entity_1.TestStatusType.ENDED);
            const testsByTime = [...endedTests]
                .map((t) => ({ test: t, start: getTestStartTime(t) }))
                .filter((x) => x.start !== null)
                .sort((a, b) => b.start.getTime() - a.start.getTime());
            const lastActivity = testsByTime[0]?.start ?? null;
            const daysSinceActivity = lastActivity
                ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
                : null;
            if (daysSinceActivity !== null && daysSinceActivity >= 2) {
                const alertDate = lastActivity;
                const isNew = daysSinceActivity < 3;
                alerts.push({
                    id: `inactivity-${child.id}`,
                    alert_type: 'warning',
                    icon: '📉',
                    icon_bg: '#FAEEDA',
                    title: `${firstName} hasn't studied in ${daysSinceActivity} day${daysSinceActivity > 1 ? 's' : ''}`,
                    description: `Their study streak is at risk. A gentle reminder could help them get back on track today.`,
                    time_label: formatTimeLabel(alertDate),
                    is_unread: isNew,
                    actions: [
                        { label: 'Assign Test', variant: 'primary', href: 'assign-test' },
                        { label: 'Dismiss', variant: 'secondary', href: 'dismiss' },
                    ],
                    sort_ts: alertDate.getTime(),
                });
            }
            if (testsByTime.length > 0) {
                const { test: latestTest, start: latestStart } = testsByTime[0];
                const score = computeScore(latestTest);
                if (score < 60 && score > 0) {
                    const courseName = latestTest.test_suite?.course_version?.course?.title ?? 'last test';
                    const isNew = latestStart !== null &&
                        now.getTime() - latestStart.getTime() < 2 * 24 * 60 * 60 * 1000;
                    alerts.push({
                        id: `low-score-${child.id}-${latestTest.id}`,
                        alert_type: 'warning',
                        icon: '⚠️',
                        icon_bg: '#FAEEDA',
                        title: `${firstName}'s ${courseName} score dropped to ${Math.round(score)}%`,
                        description: `This is below their usual average. Check their weak areas to see which topics need more practice.`,
                        time_label: formatTimeLabel(latestStart),
                        is_unread: isNew,
                        actions: [
                            { label: 'View weak areas', variant: 'primary', href: 'weak-areas' },
                            { label: 'Dismiss', variant: 'secondary', href: 'dismiss' },
                        ],
                        sort_ts: latestStart.getTime(),
                    });
                }
            }
            if (testsByTime.length >= 1 &&
                testsByTime[0].start !== null &&
                now.getTime() - testsByTime[0].start.getTime() < 48 * 60 * 60 * 1000) {
                const recentTest = testsByTime[0];
                const courseName = recentTest.test.test_suite?.course_version?.course?.title ??
                    'a subject';
                const score = computeScore(recentTest.test);
                if (score >= 60) {
                    alerts.push({
                        id: `completed-${child.id}-${recentTest.test.id}`,
                        alert_type: 'info',
                        icon: '🏆',
                        icon_bg: '#E1F5EE',
                        title: `${firstName} completed a ${courseName} session`,
                        description: `${firstName} scored ${Math.round(score)}% — great work! Keep up the momentum.`,
                        time_label: formatTimeLabel(recentTest.start),
                        is_unread: now.getTime() - recentTest.start.getTime() <
                            24 * 60 * 60 * 1000,
                        actions: [
                            {
                                label: 'View trends',
                                variant: 'primary',
                                href: 'trends',
                            },
                        ],
                        sort_ts: recentTest.start.getTime(),
                    });
                }
            }
        }
        const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
        const prevMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const reportDate = new Date(prevMonthYear, prevMonth, 1, 9, 0, 0);
        const monthName = reportDate.toLocaleString('en-US', { month: 'long' });
        if (parent.children.length > 0) {
            const hasLastMonthData = parent.children.some((child) => {
                const tests = child.student?.tests ?? [];
                return tests.some((t) => {
                    if (t.status !== test_entity_1.TestStatusType.ENDED)
                        return false;
                    const start = getTestStartTime(t);
                    return (start &&
                        start.getFullYear() === prevMonthYear &&
                        start.getMonth() + 1 === prevMonth);
                });
            });
            if (hasLastMonthData) {
                alerts.push({
                    id: `report-${prevMonthYear}-${prevMonth}`,
                    alert_type: 'info',
                    icon: '📅',
                    icon_bg: '#E1F5EE',
                    title: `${monthName} report is ready`,
                    description: `Monthly performance reports for your children are ready to view.`,
                    time_label: formatTimeLabel(reportDate),
                    is_unread: false,
                    actions: [
                        { label: 'View trends', variant: 'primary', href: 'trends' },
                    ],
                    sort_ts: reportDate.getTime(),
                });
            }
        }
        return alerts
            .sort((a, b) => b.sort_ts - a.sort_ts)
            .map(({ sort_ts: _sort_ts, ...rest }) => rest);
    }
    async listChildMonthlyReports(parentEmail, childId) {
        const child = await this.childRepository.findOne({
            where: { id: childId, parent: { email: parentEmail } },
            relations: [
                'student.tests.submitted_answers.question',
                'student.tests.time_events',
            ],
        });
        if (!child) {
            throw new common_1.NotFoundException('Child not found');
        }
        if (!child.student)
            return [];
        const endedTests = child.student.tests.filter((t) => t.status === test_entity_1.TestStatusType.ENDED);
        const getTestStartTime = (test) => {
            const event = test.time_events.find((e) => e.type === time_event_entity_1.TimeEventType.STARTED);
            return event ? new Date(event.recorded_at) : null;
        };
        const monthlyMap = new Map();
        for (const test of endedTests) {
            const start = getTestStartTime(test);
            if (!start)
                continue;
            const key = `${start.getFullYear()}-${start.getMonth() + 1}`;
            const entry = monthlyMap.get(key) ?? {
                total_score: 0,
                count: 0,
                questions: 0,
                days: new Set(),
            };
            const answers = test.submitted_answers;
            const correct = answers.filter((a) => a.is_correct === true).length;
            const score = answers.length > 0 ? (correct / answers.length) * 100 : 0;
            entry.total_score += score;
            entry.count += 1;
            entry.questions += answers.length;
            entry.days.add(start.toISOString().split('T')[0]);
            monthlyMap.set(key, entry);
        }
        return Array.from(monthlyMap.entries())
            .map(([key, entry]) => {
            const [year, month] = key.split('-').map(Number);
            return {
                month,
                year,
                avg_score: entry.count > 0 ? entry.total_score / entry.count : 0,
                total_questions: entry.questions,
                streak_days: entry.days.size,
            };
        })
            .sort((a, b) => b.year - a.year || b.month - a.month);
    }
    async generateUniqueUsername(full_name, entityManager) {
        const parts = full_name.trim().toLowerCase().split(/\s+/);
        const base = parts.length >= 2 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0];
        let username;
        let exists = true;
        while (exists) {
            const suffix = Math.floor(10 + Math.random() * 90).toString();
            username = `${base}${suffix}`;
            const found = await entityManager.findOne(child_entity_1.Child, { where: { username } });
            exists = !!found;
        }
        return username;
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
exports.ParentService = ParentService;
exports.ParentService = ParentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(parent_entity_1.Parent)),
    __param(1, (0, typeorm_1.InjectRepository)(child_entity_1.Child)),
    __param(2, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(3, (0, typeorm_1.InjectRepository)(test_assignment_entity_1.TestAssignment)),
    __param(4, (0, typeorm_1.InjectRepository)(test_suite_entity_1.TestSuite)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_producer_1.EmailProducer,
        signup_producer_1.SignupProducer])
], ParentService);
//# sourceMappingURL=parent.service.js.map