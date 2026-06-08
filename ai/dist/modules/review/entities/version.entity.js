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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Version = exports.VersionStatusType = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const admin_entity_1 = require("../../auth/entities/admin.entity");
const course_entity_1 = require("../../inventory/entities/course.entity");
const question_entity_1 = require("./question.entity");
const review_entity_1 = require("./review.entity");
const review_request_entity_1 = require("./review_request.entity");
const test_suite_entity_1 = require("./test_suite.entity");
var VersionStatusType;
(function (VersionStatusType) {
    VersionStatusType["ARCHIVED"] = "ARCHIVED";
    VersionStatusType["PENDING"] = "PENDING";
    VersionStatusType["IN_PROGRESS"] = "IN_PROGRESS";
    VersionStatusType["APPROVED"] = "APPROVED";
    VersionStatusType["REJECTED"] = "REJECTED";
})(VersionStatusType || (exports.VersionStatusType = VersionStatusType = {}));
(0, graphql_1.registerEnumType)(VersionStatusType, {
    name: 'VersionStatusType',
    description: 'Version status',
});
let Version = class Version {
};
exports.Version = Version;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Version.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Version.prototype, "version_number", void 0);
__decorate([
    (0, graphql_1.Field)(() => VersionStatusType),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: VersionStatusType,
        default: VersionStatusType.PENDING,
    }),
    __metadata("design:type", String)
], Version.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(() => review_request_entity_1.ReviewRequest, { nullable: true }),
    (0, typeorm_1.OneToOne)(() => review_request_entity_1.ReviewRequest, (reviewRequest) => reviewRequest.course_version),
    __metadata("design:type", review_request_entity_1.ReviewRequest)
], Version.prototype, "review_request", void 0);
__decorate([
    (0, graphql_1.Field)(() => admin_entity_1.Admin, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => admin_entity_1.Admin, (course) => course.assigned_course_versions_for_review),
    __metadata("design:type", admin_entity_1.Admin)
], Version.prototype, "assigned_admin", void 0);
__decorate([
    (0, graphql_1.Field)(() => course_entity_1.Course, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => course_entity_1.Course, (course) => course.versions),
    __metadata("design:type", course_entity_1.Course)
], Version.prototype, "course", void 0);
__decorate([
    (0, graphql_1.Field)(() => [review_entity_1.Review], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => review_entity_1.Review, (review) => review.course_version),
    __metadata("design:type", Array)
], Version.prototype, "reviews", void 0);
__decorate([
    (0, graphql_1.Field)(() => [question_entity_1.Question], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => question_entity_1.Question, (question) => question.version),
    __metadata("design:type", Array)
], Version.prototype, "questions", void 0);
__decorate([
    (0, graphql_1.Field)(() => [test_suite_entity_1.TestSuite], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => test_suite_entity_1.TestSuite, (test_suite) => test_suite.course_version),
    __metadata("design:type", Array)
], Version.prototype, "test_suites", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Version.prototype, "inserted_at", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Version.prototype, "updated_at", void 0);
exports.Version = Version = __decorate([
    (0, graphql_1.ObjectType)('Version'),
    (0, typeorm_1.Entity)('versions')
], Version);
//# sourceMappingURL=version.entity.js.map