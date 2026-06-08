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
exports.InstructorResolver = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const course_entity_1 = require("../../inventory/entities/course.entity");
const issue_entity_1 = require("../entities/issue.entity");
const review_entity_1 = require("../entities/review.entity");
const guards_1 = require("../../../helpers/guards");
const inputs_1 = require("../../../helpers/inputs");
const types_1 = require("../../../helpers/types");
const services_1 = require("../services");
const types_2 = require("../types");
let InstructorResolver = class InstructorResolver {
    constructor(instructorService) {
        this.instructorService = instructorService;
    }
    getInstructorVersionReview(context, reviewId) {
        const { email } = context.req.user;
        return this.instructorService.getVersionReview({
            email,
            reviewId,
        });
    }
    listInstructorQuestionsForVersion(context, versionId, searchTerm, pagination) {
        const { email } = context.req.user;
        return this.instructorService.listQuestionsForVersionPaginated({
            email,
            searchTerm,
            versionId,
            pagination,
        });
    }
    getCourse(context, courseId) {
        const { email } = context.req.user;
        return this.instructorService.getCourse({
            email,
            courseId,
        });
    }
    getInstructorCourseVersion(context, versionId) {
        const { email } = context.req.user;
        return this.instructorService.getCourseVersion({
            email,
            versionId,
        });
    }
    listCourses(context, searchTerm, pagination) {
        const { email } = context.req.user;
        return this.instructorService.listCoursesPaginated({
            email,
            searchTerm,
            pagination,
        });
    }
    updateIssue(context, issueId, issueStatus, response) {
        const { email } = context.req.user;
        return this.instructorService.updateIssueStatus({
            email,
            issueId,
            issueStatus,
            response,
        });
    }
};
exports.InstructorResolver = InstructorResolver;
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => review_entity_1.Review),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('reviewId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InstructorResolver.prototype, "getInstructorVersionReview", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_2.QuestionConnection),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('versionId')),
    __param(2, (0, graphql_1.Args)('searchTerm', { nullable: true })),
    __param(3, (0, graphql_1.Args)('pagination', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, inputs_1.PaginationInput]),
    __metadata("design:returntype", void 0)
], InstructorResolver.prototype, "listInstructorQuestionsForVersion", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => course_entity_1.Course),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('courseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InstructorResolver.prototype, "getCourse", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_2.VersionResponse),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('versionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InstructorResolver.prototype, "getInstructorCourseVersion", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_1.CourseConnection),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('searchTerm', { nullable: true })),
    __param(2, (0, graphql_1.Args)('pagination', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, inputs_1.PaginationInput]),
    __metadata("design:returntype", void 0)
], InstructorResolver.prototype, "listCourses", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => issue_entity_1.Issue),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('issueId')),
    __param(2, (0, graphql_1.Args)('issueStatus', { type: () => issue_entity_1.IssueStatusType, nullable: false })),
    __param(3, (0, graphql_1.Args)('response')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], InstructorResolver.prototype, "updateIssue", null);
exports.InstructorResolver = InstructorResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [services_1.InstructorService])
], InstructorResolver);
//# sourceMappingURL=instructor.resolver.js.map