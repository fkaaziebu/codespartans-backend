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
exports.OrganizationResolver = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const category_entity_1 = require("../entities/category.entity");
const version_entity_1 = require("../../review/entities/version.entity");
const guards_1 = require("../../../helpers/guards");
const inputs_1 = require("../../../helpers/inputs");
const types_1 = require("../../../helpers/types");
const inputs_2 = require("../inputs");
const services_1 = require("../services");
const types_2 = require("../types");
let OrganizationResolver = class OrganizationResolver {
    constructor(organizationService) {
        this.organizationService = organizationService;
    }
    getStats(context) {
        const { email } = context.req.user;
        return this.organizationService.getStats({
            email,
        });
    }
    listInstructors(context, searchTerm, pagination) {
        const { email } = context.req.user;
        return this.organizationService.listInstructorsPaginated({
            email,
            searchTerm,
            pagination,
        });
    }
    listAdmins(context, searchTerm, pagination) {
        const { email } = context.req.user;
        return this.organizationService.listAdminsPaginated({
            email,
            searchTerm,
            pagination,
        });
    }
    listRequestedReviews(context, filter, pagination) {
        const { email } = context.req.user;
        return this.organizationService.listRequestedReviewsPaginated({
            email,
            filter,
            pagination,
        });
    }
    listCoursesForOrganization(context, searchTerm, pagination) {
        const { email } = context.req.user;
        return this.organizationService.listCoursesPaginated({
            email,
            searchTerm,
            pagination,
        });
    }
    assignCourseVersionForReview(context, versionId, adminId) {
        const { email } = context.req.user;
        return this.organizationService.assignCourseVersionForReview({
            email,
            versionId,
            adminId,
        });
    }
    createCategory(context, categoryInfo) {
        const { email } = context.req.user;
        return this.organizationService.createCategory({ email, categoryInfo });
    }
    addCoursesToCategory(context, categoryId, courseIds) {
        const { email } = context.req.user;
        return this.organizationService.addCoursesToCategory({
            email,
            categoryId,
            courseIds,
        });
    }
};
exports.OrganizationResolver = OrganizationResolver;
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_2.StatsResponse),
    __param(0, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrganizationResolver.prototype, "getStats", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_2.InstructorConnection),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('searchTerm', { nullable: true })),
    __param(2, (0, graphql_1.Args)('pagination', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, inputs_1.PaginationInput]),
    __metadata("design:returntype", void 0)
], OrganizationResolver.prototype, "listInstructors", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_2.AdminConnection),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('searchTerm', { nullable: true })),
    __param(2, (0, graphql_1.Args)('pagination', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, inputs_1.PaginationInput]),
    __metadata("design:returntype", void 0)
], OrganizationResolver.prototype, "listAdmins", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_2.RequestedReviewConnection),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('filter', { nullable: true })),
    __param(2, (0, graphql_1.Args)('pagination', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, inputs_2.RequestedReviewFilterInput,
        inputs_1.PaginationInput]),
    __metadata("design:returntype", void 0)
], OrganizationResolver.prototype, "listRequestedReviews", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_1.CourseConnection),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('searchTerm', { nullable: true })),
    __param(2, (0, graphql_1.Args)('pagination', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, inputs_1.PaginationInput]),
    __metadata("design:returntype", void 0)
], OrganizationResolver.prototype, "listCoursesForOrganization", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => version_entity_1.Version),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('versionId')),
    __param(2, (0, graphql_1.Args)('adminId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], OrganizationResolver.prototype, "assignCourseVersionForReview", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => category_entity_1.Category),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('categoryInfo', { type: () => inputs_2.CategoryInfoInput, nullable: false })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, inputs_2.CategoryInfoInput]),
    __metadata("design:returntype", void 0)
], OrganizationResolver.prototype, "createCategory", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => category_entity_1.Category),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('categoryId')),
    __param(2, (0, graphql_1.Args)('courseIds', { type: () => [String], nullable: false })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array]),
    __metadata("design:returntype", void 0)
], OrganizationResolver.prototype, "addCoursesToCategory", null);
exports.OrganizationResolver = OrganizationResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [services_1.OrganizationService])
], OrganizationResolver);
//# sourceMappingURL=organization.resolver.js.map