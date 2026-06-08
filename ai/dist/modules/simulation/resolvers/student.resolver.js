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
exports.StudentResolver = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const course_entity_1 = require("../../inventory/entities/course.entity");
const inputs_1 = require("../../inventory/inputs");
const question_entity_1 = require("../../review/entities/question.entity");
const sumitted_answer_entity_1 = require("../entities/sumitted_answer.entity");
const test_entity_1 = require("../entities/test.entity");
const test_assignment_entity_1 = require("../entities/test_assignment.entity");
const guards_1 = require("../../../helpers/guards");
const services_1 = require("../services");
const weekly_insight_type_1 = require("../types/weekly-insight.type");
let StudentResolver = class StudentResolver {
    constructor(studentService, insightService) {
        this.studentService = studentService;
        this.insightService = insightService;
    }
    getSubscribedCourseDetails(context, courseId, filter) {
        const { email } = context.req.user;
        return this.studentService.getSubscribedCourseDetails({
            email,
            courseId,
            filter,
        });
    }
    getQuestion(context, testId) {
        const { email } = context.req.user;
        return this.studentService.getQuestion({
            email,
            testId,
        });
    }
    getWeeklyInsight(context) {
        const { email } = context.req.user;
        return this.insightService.getWeeklyInsight({ email });
    }
    testStats(context, testId) {
        const { email } = context.req.user;
        return this.studentService.testStats({ email, testId });
    }
    getAllAttemptedQuestions(context, testId) {
        const { email } = context.req.user;
        return this.studentService.getAllAttemptedQuestions({ email, testId });
    }
    startTest(context, suiteId, mode) {
        const { email } = context.req.user;
        return this.studentService.startTest({
            email,
            suiteId,
            mode,
        });
    }
    pauseTest(context, testId) {
        const { email } = context.req.user;
        return this.studentService.pauseTest({
            email,
            testId,
        });
    }
    resumeTest(context, testId) {
        const { email } = context.req.user;
        return this.studentService.resumeTest({
            email,
            testId,
        });
    }
    endTest(context, testId) {
        const { email } = context.req.user;
        return this.studentService.endTest({
            email,
            testId,
        });
    }
    submitAnswer(context, testId, questionId, timeRange, answer, isFlagged) {
        const { email } = context.req.user;
        return this.studentService.submitAnswer({
            email,
            testId,
            questionId,
            timeRange,
            answer,
            isFlagged,
        });
    }
    listMyAssignments(context) {
        const { email } = context.req.user;
        return this.studentService.listMyAssignments({ email });
    }
    startAssignedTest(context, assignmentId, mode) {
        const { email } = context.req.user;
        return this.studentService.startAssignedTest({ email, assignmentId, mode });
    }
};
exports.StudentResolver = StudentResolver;
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard, guards_1.SubscriptionGuard),
    (0, graphql_1.Query)(() => course_entity_1.Course),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('courseId')),
    __param(2, (0, graphql_1.Args)('filter', { type: () => inputs_1.SuiteFilterInput, nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, inputs_1.SuiteFilterInput]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "getSubscribedCourseDetails", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard, guards_1.SubscriptionGuard),
    (0, graphql_1.Query)(() => question_entity_1.Question),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('testId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "getQuestion", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => weekly_insight_type_1.WeeklyInsight, { nullable: true }),
    __param(0, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "getWeeklyInsight", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => test_entity_1.Test),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('testId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "testStats", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [sumitted_answer_entity_1.SubmittedAnswer]),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('testId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "getAllAttemptedQuestions", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard, guards_1.SubscriptionGuard),
    (0, graphql_1.Mutation)(() => test_entity_1.Test),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('suiteId')),
    __param(2, (0, graphql_1.Args)('mode', { type: () => test_entity_1.TestModeType, nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "startTest", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard, guards_1.SubscriptionGuard),
    (0, graphql_1.Mutation)(() => test_entity_1.Test),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('testId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "pauseTest", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard, guards_1.SubscriptionGuard),
    (0, graphql_1.Mutation)(() => test_entity_1.Test),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('testId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "resumeTest", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard, guards_1.SubscriptionGuard),
    (0, graphql_1.Mutation)(() => test_entity_1.Test),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('testId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "endTest", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard, guards_1.SubscriptionGuard),
    (0, graphql_1.Mutation)(() => sumitted_answer_entity_1.SubmittedAnswer),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('testId')),
    __param(2, (0, graphql_1.Args)('questionId')),
    __param(3, (0, graphql_1.Args)('timeRange')),
    __param(4, (0, graphql_1.Args)('answer')),
    __param(5, (0, graphql_1.Args)('isFlagged')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, Boolean]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "submitAnswer", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [test_assignment_entity_1.TestAssignment]),
    __param(0, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "listMyAssignments", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard, guards_1.SubscriptionGuard),
    (0, graphql_1.Mutation)(() => test_entity_1.Test),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('assignmentId')),
    __param(2, (0, graphql_1.Args)('mode', { type: () => test_entity_1.TestModeType, nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "startAssignedTest", null);
exports.StudentResolver = StudentResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [services_1.StudentService,
        services_1.InsightService])
], StudentResolver);
//# sourceMappingURL=student.resolver.js.map