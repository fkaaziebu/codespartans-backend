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
const course_entity_1 = require("../entities/course.entity");
const question_entity_1 = require("../../review/entities/question.entity");
const review_request_entity_1 = require("../../review/entities/review_request.entity");
const version_entity_1 = require("../../review/entities/version.entity");
const guards_1 = require("../../../helpers/guards");
const inputs_1 = require("../inputs");
const services_1 = require("../services");
let InstructorResolver = class InstructorResolver {
    constructor(instructorService) {
        this.instructorService = instructorService;
    }
    createCourse(context, organizationId, courseInfo) {
        const { email } = context.req.user;
        return this.instructorService.createCourse({
            email,
            courseInfo,
            organizationId,
        });
    }
    updateCourse(context, courseId, courseInfo) {
        const { email } = context.req.user;
        return this.instructorService.updateCourse({ email });
    }
    addCourseVersion(context, courseId) {
        const { email } = context.req.user;
        return this.instructorService.addCourseVersion({ email, courseId });
    }
    addQuestionsToCourseVersion(context, versionId, suiteTitle, suiteDescription, suiteKeywords, questions) {
        const { email } = context.req.user;
        return this.instructorService.addQuestionsToCourseVersion({
            email,
            versionId,
            suiteTitle,
            suiteDescription,
            suiteKeywords,
            questions,
        });
    }
    updateQuestion(context, questionId, question) {
        const { email } = context.req.user;
        return this.instructorService.updateQuestion({
            email,
            questionId,
            question,
        });
    }
    requestCourseVersionReview(context, versionId) {
        const { email } = context.req.user;
        return this.instructorService.requestCourseVersionReview({
            email,
            versionId,
        });
    }
};
exports.InstructorResolver = InstructorResolver;
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => course_entity_1.Course),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('organizationId')),
    __param(2, (0, graphql_1.Args)('courseInfo', { type: () => inputs_1.CourseInfoInput, nullable: false })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, inputs_1.CourseInfoInput]),
    __metadata("design:returntype", void 0)
], InstructorResolver.prototype, "createCourse", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => course_entity_1.Course),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('courseId')),
    __param(2, (0, graphql_1.Args)('courseInfo', { type: () => inputs_1.UpdateCourseInfoInput, nullable: false })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, inputs_1.UpdateCourseInfoInput]),
    __metadata("design:returntype", void 0)
], InstructorResolver.prototype, "updateCourse", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => version_entity_1.Version),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('courseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InstructorResolver.prototype, "addCourseVersion", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => version_entity_1.Version),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('versionId')),
    __param(2, (0, graphql_1.Args)('suiteTitle')),
    __param(3, (0, graphql_1.Args)('suiteDescription')),
    __param(4, (0, graphql_1.Args)('suiteKeywords', { type: () => [String] })),
    __param(5, (0, graphql_1.Args)('questions', { type: () => [inputs_1.QuestionInput], nullable: false })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Array, Array]),
    __metadata("design:returntype", void 0)
], InstructorResolver.prototype, "addQuestionsToCourseVersion", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => question_entity_1.Question),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('questionId')),
    __param(2, (0, graphql_1.Args)('question', { type: () => inputs_1.QuestionInput })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, inputs_1.QuestionInput]),
    __metadata("design:returntype", void 0)
], InstructorResolver.prototype, "updateQuestion", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => review_request_entity_1.ReviewRequest),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('versionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InstructorResolver.prototype, "requestCourseVersionReview", null);
exports.InstructorResolver = InstructorResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [services_1.InstructorService])
], InstructorResolver);
//# sourceMappingURL=instructor.resolver.js.map