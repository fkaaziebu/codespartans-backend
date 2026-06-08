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
exports.ParentResolver = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const course_entity_1 = require("../../inventory/entities/course.entity");
const test_assignment_entity_1 = require("../../simulation/entities/test_assignment.entity");
const guards_1 = require("../../../helpers/guards");
const inputs_1 = require("../../../helpers/inputs");
const types_1 = require("../../auth/types");
const category_entity_1 = require("../../inventory/entities/category.entity");
const types_2 = require("../../inventory/types");
const subject_progress_response_type_1 = require("../../inventory/types/subject-progress-response.type");
const weak_subject_area_response_type_1 = require("../../inventory/types/weak-subject-area-response.type");
const add_child_input_1 = require("../inputs/add-child.input");
const login_child_input_1 = require("../inputs/login-child.input");
const login_parent_input_1 = require("../inputs/login-parent.input");
const register_parent_input_1 = require("../inputs/register-parent.input");
const setup_parent_account_input_1 = require("../inputs/setup-parent-account.input");
const verify_child_username_input_1 = require("../inputs/verify-child-username.input");
const verify_parent_input_1 = require("../inputs/verify-parent.input");
const parent_service_1 = require("../services/parent.service");
const types_3 = require("../types");
let ParentResolver = class ParentResolver {
    constructor(parentService) {
        this.parentService = parentService;
    }
    async registerParent(input) {
        return this.parentService.registerParent(input);
    }
    async verifyParentAccount(input) {
        return this.parentService.verifyParentAccount(input);
    }
    async resendParentAccountValidationCode(email) {
        return this.parentService.resendParentAccountValidationCode(email);
    }
    async loginParent(input) {
        return this.parentService.loginParent(input);
    }
    async refreshParentToken(refresh_token) {
        return this.parentService.refreshParentToken(refresh_token);
    }
    async requestParentPasswordReset(email) {
        return this.parentService.requestParentPasswordReset({ email });
    }
    async resetParentPassword(email, token, password) {
        return this.parentService.resetParentPassword({ email, token, password });
    }
    async setupParentAccount(input, context) {
        const { email } = context.req.user;
        return this.parentService.setupParentAccount(email, input.children);
    }
    async addChild(input, context) {
        const { email } = context.req.user;
        return this.parentService.addChild(email, input);
    }
    async resetChildPin(childId, context) {
        const { email } = context.req.user;
        return this.parentService.resetChildPin(email, childId);
    }
    async shareChildLogin(childId, context) {
        const { email } = context.req.user;
        return this.parentService.shareChildLogin(email, childId);
    }
    async listParentOrganizationCategories(searchTerm) {
        return this.parentService.listOrganizationCategories(searchTerm);
    }
    async listChildren(context, pagination) {
        const { email } = context.req.user;
        return this.parentService.listChildren(email, pagination);
    }
    async getChildStats(childId, context) {
        const { email } = context.req.user;
        return this.parentService.getChildStats(email, childId);
    }
    async getChildSubjectProgress(childId, context, courseId) {
        const { email } = context.req.user;
        return this.parentService.getChildSubjectProgress(email, childId, courseId);
    }
    async getChildTestsHistory(childId, context, pagination) {
        const { email } = context.req.user;
        return this.parentService.getChildTestsHistory(email, childId, pagination);
    }
    async getChildWeakAreas(childId, context) {
        const { email } = context.req.user;
        return this.parentService.getChildWeakAreas(email, childId);
    }
    async getChildActivity(childId, context, pagination) {
        const { email } = context.req.user;
        return this.parentService.getChildActivity(email, childId, pagination);
    }
    async getChildStreak(childId, context) {
        const { email } = context.req.user;
        return this.parentService.getChildStreak(email, childId);
    }
    async listChildStreak(childId, month, year, context) {
        const { email } = context.req.user;
        return this.parentService.listChildStreak(email, childId, month, year);
    }
    async verifyChildUsername(input) {
        return this.parentService.verifyChildUsername(input.username);
    }
    async loginChild(input) {
        return this.parentService.loginChild(input.temp_token, input.pin);
    }
    async assignTestToChild(childId, suiteId, context, note) {
        const { email } = context.req.user;
        return this.parentService.assignTestToChild(email, childId, suiteId, note);
    }
    async listParentAlerts(context) {
        const { email } = context.req.user;
        return this.parentService.listParentAlerts(email);
    }
    async listChildMonthlyReports(childId, context) {
        const { email } = context.req.user;
        return this.parentService.listChildMonthlyReports(email, childId);
    }
    async listChildCourses(childId, context) {
        const { email } = context.req.user;
        return this.parentService.listChildCourses(email, childId);
    }
    async listChildAssignments(childId, context) {
        const { email } = context.req.user;
        return this.parentService.listChildAssignments(email, childId);
    }
};
exports.ParentResolver = ParentResolver;
__decorate([
    (0, graphql_1.Mutation)(() => types_3.RegisterParentResponse),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_parent_input_1.RegisterParentInput]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "registerParent", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_3.RegisterParentResponse),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_parent_input_1.VerifyParentInput]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "verifyParentAccount", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_3.RegisterParentResponse),
    __param(0, (0, graphql_1.Args)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "resendParentAccountValidationCode", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_3.LoginParentResponse),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_parent_input_1.LoginParentInput]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "loginParent", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_1.RefreshTokenResponse),
    __param(0, (0, graphql_1.Args)('refresh_token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "refreshParentToken", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_3.RegisterParentResponse),
    __param(0, (0, graphql_1.Args)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "requestParentPasswordReset", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_3.RegisterParentResponse),
    __param(0, (0, graphql_1.Args)('email')),
    __param(1, (0, graphql_1.Args)('token')),
    __param(2, (0, graphql_1.Args)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "resetParentPassword", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => [types_3.SetupChildResult]),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [setup_parent_account_input_1.SetupParentAccountInput, Object]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "setupParentAccount", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => types_3.AddChildResponse),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [add_child_input_1.AddChildInput, Object]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "addChild", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => types_3.AddChildResponse),
    __param(0, (0, graphql_1.Args)('childId')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "resetChildPin", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_3.RegisterParentResponse),
    __param(0, (0, graphql_1.Args)('childId')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "shareChildLogin", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [category_entity_1.Category]),
    __param(0, (0, graphql_1.Args)('searchTerm', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "listParentOrganizationCategories", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_3.ChildConnection),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('pagination', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, inputs_1.PaginationInput]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "listChildren", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_3.ChildStatsResponse),
    __param(0, (0, graphql_1.Args)('childId')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "getChildStats", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [subject_progress_response_type_1.SubjectProgressResponse]),
    __param(0, (0, graphql_1.Args)('childId')),
    __param(1, (0, graphql_1.Context)()),
    __param(2, (0, graphql_1.Args)('courseId', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "getChildSubjectProgress", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_2.AttemptConnection),
    __param(0, (0, graphql_1.Args)('childId')),
    __param(1, (0, graphql_1.Context)()),
    __param(2, (0, graphql_1.Args)('pagination', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, inputs_1.PaginationInput]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "getChildTestsHistory", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [weak_subject_area_response_type_1.WeakSubjectAreaResponse]),
    __param(0, (0, graphql_1.Args)('childId')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "getChildWeakAreas", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_3.ActivityConnection),
    __param(0, (0, graphql_1.Args)('childId')),
    __param(1, (0, graphql_1.Context)()),
    __param(2, (0, graphql_1.Args)('pagination', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, inputs_1.PaginationInput]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "getChildActivity", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_3.StreakResponse),
    __param(0, (0, graphql_1.Args)('childId')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "getChildStreak", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [types_3.DayStreakResponse]),
    __param(0, (0, graphql_1.Args)('childId')),
    __param(1, (0, graphql_1.Args)('month', { type: () => graphql_1.Int })),
    __param(2, (0, graphql_1.Args)('year', { type: () => graphql_1.Int })),
    __param(3, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "listChildStreak", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_3.VerifyChildUsernameResponse),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_child_username_input_1.VerifyChildUsernameInput]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "verifyChildUsername", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_3.LoginChildResponse),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_child_input_1.LoginChildInput]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "loginChild", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => test_assignment_entity_1.TestAssignment),
    __param(0, (0, graphql_1.Args)('childId')),
    __param(1, (0, graphql_1.Args)('suiteId')),
    __param(2, (0, graphql_1.Context)()),
    __param(3, (0, graphql_1.Args)('note', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, String]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "assignTestToChild", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [types_3.AlertResponse]),
    __param(0, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "listParentAlerts", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [types_3.MonthlyReportResponse]),
    __param(0, (0, graphql_1.Args)('childId')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "listChildMonthlyReports", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [course_entity_1.Course]),
    __param(0, (0, graphql_1.Args)('childId')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "listChildCourses", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [test_assignment_entity_1.TestAssignment]),
    __param(0, (0, graphql_1.Args)('childId')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ParentResolver.prototype, "listChildAssignments", null);
exports.ParentResolver = ParentResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [parent_service_1.ParentService])
], ParentResolver);
//# sourceMappingURL=parent.resolver.js.map