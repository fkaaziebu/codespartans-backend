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
exports.AdminResolver = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const issue_entity_1 = require("../entities/issue.entity");
const review_entity_1 = require("../entities/review.entity");
const version_entity_1 = require("../entities/version.entity");
const guards_1 = require("../../../helpers/guards");
const inputs_1 = require("../../../helpers/inputs");
const inputs_2 = require("../inputs");
const services_1 = require("../services");
const types_1 = require("../types");
let AdminResolver = class AdminResolver {
    constructor(adminService) {
        this.adminService = adminService;
    }
    listQuestionsForVersion(context, versionId, searchTerm, pagination) {
        const { email } = context.req.user;
        return this.adminService.listQuestionsForVersionPaginated({
            email,
            searchTerm,
            versionId,
            pagination,
        });
    }
    listAssignedVersions(context) {
        const { email } = context.req.user;
        return this.adminService.listAssignedVersionsPaginated({
            email,
        });
    }
    getCourseVersion(context, versionId) {
        const { email } = context.req.user;
        return this.adminService.getCourseVersion({
            email,
            versionId,
        });
    }
    getVersionReview(context, reviewId) {
        const { email } = context.req.user;
        return this.adminService.getVersionReview({
            email,
            reviewId,
        });
    }
    addCourseVersionReview(context, versionId, reviewInfo) {
        const { email } = context.req.user;
        return this.adminService.addCourseVersionReview({
            email,
            versionId,
            reviewInfo,
        });
    }
    addReviewIssue(context, reviewId, issueInfo) {
        const { email } = context.req.user;
        return this.adminService.addReviewIssue({ email, reviewId, issueInfo });
    }
    closeIssue(context, issueId) {
        const { email } = context.req.user;
        return this.adminService.closeIssue({ email, issueId });
    }
    closeReview(context, reviewId) {
        const { email } = context.req.user;
        return this.adminService.closeReview({ email, reviewId });
    }
    approveCourseVersion(context, versionId) {
        const { email } = context.req.user;
        return this.adminService.approveCourseVersion({ email, versionId });
    }
};
exports.AdminResolver = AdminResolver;
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_1.QuestionConnection),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('versionId')),
    __param(2, (0, graphql_1.Args)('searchTerm', { nullable: true })),
    __param(3, (0, graphql_1.Args)('pagination', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, inputs_1.PaginationInput]),
    __metadata("design:returntype", void 0)
], AdminResolver.prototype, "listQuestionsForVersion", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_1.VersionConnection),
    __param(0, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminResolver.prototype, "listAssignedVersions", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_1.VersionResponse),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('versionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminResolver.prototype, "getCourseVersion", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => review_entity_1.Review),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('reviewId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminResolver.prototype, "getVersionReview", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => review_entity_1.Review),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('versionId')),
    __param(2, (0, graphql_1.Args)('reviewInfo', { type: () => inputs_2.ReviewInfoInput, nullable: false })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, inputs_2.ReviewInfoInput]),
    __metadata("design:returntype", void 0)
], AdminResolver.prototype, "addCourseVersionReview", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => issue_entity_1.Issue),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('reviewId')),
    __param(2, (0, graphql_1.Args)('issueInfo', { type: () => inputs_2.IssueInfoInput, nullable: false })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, inputs_2.IssueInfoInput]),
    __metadata("design:returntype", void 0)
], AdminResolver.prototype, "addReviewIssue", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => issue_entity_1.Issue),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('issueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminResolver.prototype, "closeIssue", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => review_entity_1.Review),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('reviewId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminResolver.prototype, "closeReview", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => version_entity_1.Version),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('versionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminResolver.prototype, "approveCourseVersion", null);
exports.AdminResolver = AdminResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [services_1.AdminService])
], AdminResolver);
//# sourceMappingURL=admin.resolver.js.map