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
const cart_entity_1 = require("../entities/cart.entity");
const category_entity_1 = require("../entities/category.entity");
const checkout_entity_1 = require("../entities/checkout.entity");
const course_entity_1 = require("../entities/course.entity");
const student_entity_1 = require("../../auth/entities/student.entity");
const test_entity_1 = require("../../simulation/entities/test.entity");
const guards_1 = require("../../../helpers/guards");
const inputs_1 = require("../../../helpers/inputs");
const types_1 = require("../../../helpers/types");
const test_suite_entity_1 = require("../../review/entities/test_suite.entity");
const inputs_2 = require("../inputs");
const services_1 = require("../services");
const types_2 = require("../types");
const types_3 = require("../../parent/types");
let StudentResolver = class StudentResolver {
    constructor(studentService) {
        this.studentService = studentService;
    }
    getOrganizationCourse(context, courseId) {
        const { email } = context.req.user;
        return this.studentService.getOrganizationCourse({
            email,
            courseId,
        });
    }
    listOrganizationCourses(context, organizationId, searchTerm, pagination, filter) {
        const { email } = context.req.user;
        return this.studentService.listOrganizationCoursesPaginated({
            email,
            organizationId,
            searchTerm,
            pagination,
            filter,
        });
    }
    listOrganizationCategories(context, searchTerm) {
        const { email } = context.req.user;
        return this.studentService.listOrganizationCategories({
            email,
            searchTerm,
        });
    }
    listCartCourses(context) {
        const { email } = context.req.user;
        return this.studentService.listCartCourses({
            email,
        });
    }
    listAttempts(context, searchTerm, filter, pagination) {
        const { email } = context.req.user;
        return this.studentService.listAttempts({
            email,
            searchTerm,
            filter,
            pagination,
        });
    }
    listCourseSuites(context, courseId, suiteTypes, pagination) {
        const { email } = context.req.user;
        return this.studentService.listCourseSuitesPaginated({
            email,
            courseId,
            suiteTypes,
            pagination,
        });
    }
    getActiveTest(context) {
        const { email } = context.req.user;
        return this.studentService.getActiveTest({ email });
    }
    getTest(context, testId) {
        const { email } = context.req.user;
        return this.studentService.getTest({ email, testId });
    }
    getStudentStats(context) {
        const { email } = context.req.user;
        return this.studentService.getStats({ email });
    }
    getCurrentStreakCount(context) {
        const { email } = context.req.user;
        return this.studentService.getCurrentStreakCount({ email });
    }
    studentSubjectProgress(context, testId) {
        const { email } = context.req.user;
        return this.studentService.studentSubjectProgress({ email, testId });
    }
    studentTestTopicProgress(context, testId) {
        const { email } = context.req.user;
        return this.studentService.studentTestTopicProgress({ email, testId });
    }
    weakSubjectAreas(context, testId) {
        const { email } = context.req.user;
        return this.studentService.weakSubjectAreas({ email, testId });
    }
    getTestScoreHistory(context, testId) {
        const { email } = context.req.user;
        return this.studentService.getTestScoreHistory({ email, testId });
    }
    listCartCategories(context) {
        const { email } = context.req.user;
        return this.studentService.listCartCategories({
            email,
        });
    }
    addCourseToCart(context, courseId) {
        const { email } = context.req.user;
        return this.studentService.addCourseToCart({ email, courseId });
    }
    completeSetup(context, categoryId, courseIds) {
        const { email } = context.req.user;
        return this.studentService.completeSetup({ email, categoryId, courseIds });
    }
    removeCourseFromCart(context, courseId) {
        const { email } = context.req.user;
        return this.studentService.removeCourseFromCart({ email, courseId });
    }
    addCategoryToCart(context, categoryId) {
        const { email } = context.req.user;
        return this.studentService.addCategoryToCart({ email, categoryId });
    }
    changeStudentPassword(context, currentPassword, newPassword) {
        const { email } = context.req.user;
        return this.studentService.changeStudentPassword({
            email,
            currentPassword,
            newPassword,
        });
    }
    createCheckout(context, autoApproveSubscription, checkoutFromCart, courseId) {
        const { email } = context.req.user;
        return this.studentService.createCheckout({
            email,
            autoApproveSubscription,
            checkoutFromCart,
            courseId,
        });
    }
};
exports.StudentResolver = StudentResolver;
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard, guards_1.SubscriptionGuard),
    (0, graphql_1.Query)(() => types_2.StudentCourseResponse),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('courseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "getOrganizationCourse", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_1.CourseConnection),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('organizationId', { nullable: true })),
    __param(2, (0, graphql_1.Args)('searchTerm', { nullable: true })),
    __param(3, (0, graphql_1.Args)('pagination', { nullable: true })),
    __param(4, (0, graphql_1.Args)('filter', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, inputs_1.PaginationInput,
        inputs_2.CourseFilterInput]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "listOrganizationCourses", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [category_entity_1.Category]),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('searchTerm', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "listOrganizationCategories", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [course_entity_1.Course]),
    __param(0, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "listCartCourses", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_2.AttemptConnection),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('searchTerm', { nullable: true })),
    __param(2, (0, graphql_1.Args)('filter', { nullable: true })),
    __param(3, (0, graphql_1.Args)('pagination', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, inputs_2.AttemptFilterInput,
        inputs_1.PaginationInput]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "listAttempts", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard, guards_1.SubscriptionGuard),
    (0, graphql_1.Query)(() => types_2.TestSuiteConnection),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('courseId')),
    __param(2, (0, graphql_1.Args)('suiteTypes', { type: () => [test_suite_entity_1.SuiteType], nullable: true })),
    __param(3, (0, graphql_1.Args)('pagination', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array, inputs_1.PaginationInput]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "listCourseSuites", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => test_entity_1.Test),
    __param(0, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "getActiveTest", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => test_entity_1.Test),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('testId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "getTest", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_2.StudentStatsResponse),
    __param(0, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "getStudentStats", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_3.StreakResponse),
    __param(0, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "getCurrentStreakCount", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [types_2.SubjectProgressResponse]),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('testId', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "studentSubjectProgress", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [types_2.TestTopicProgressResponse]),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('testId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "studentTestTopicProgress", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [types_2.WeakSubjectAreaResponse]),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('testId', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "weakSubjectAreas", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [types_2.TestScoreHistoryResponse]),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('testId', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "getTestScoreHistory", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [category_entity_1.Category]),
    __param(0, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "listCartCategories", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => cart_entity_1.Cart),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('courseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "addCourseToCart", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => student_entity_1.Student),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('categoryId')),
    __param(2, (0, graphql_1.Args)('courseIds', { type: () => [String], nullable: false })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "completeSetup", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => cart_entity_1.Cart),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('courseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "removeCourseFromCart", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => cart_entity_1.Cart),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('categoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "addCategoryToCart", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => student_entity_1.Student),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('currentPassword')),
    __param(2, (0, graphql_1.Args)('newPassword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "changeStudentPassword", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => checkout_entity_1.Checkout),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('autoApproveSubscription')),
    __param(2, (0, graphql_1.Args)('checkoutFromCart', { nullable: true })),
    __param(3, (0, graphql_1.Args)('courseId', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Boolean, Boolean, String]),
    __metadata("design:returntype", void 0)
], StudentResolver.prototype, "createCheckout", null);
exports.StudentResolver = StudentResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [services_1.StudentService])
], StudentResolver);
//# sourceMappingURL=student.resolver.js.map