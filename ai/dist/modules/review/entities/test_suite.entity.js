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
exports.TestSuite = exports.SuiteType = exports.SuiteDifficultyType = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const question_entity_1 = require("./question.entity");
const version_entity_1 = require("./version.entity");
var SuiteDifficultyType;
(function (SuiteDifficultyType) {
    SuiteDifficultyType["BEGINNER"] = "BEGINNER";
    SuiteDifficultyType["INTERMEDIATE"] = "INTERMEDIATE";
    SuiteDifficultyType["ADVANCED"] = "ADVANCED";
})(SuiteDifficultyType || (exports.SuiteDifficultyType = SuiteDifficultyType = {}));
(0, graphql_1.registerEnumType)(SuiteDifficultyType, {
    name: 'SuiteDifficultyType',
    description: 'Suite difficulty',
});
var SuiteType;
(function (SuiteType) {
    SuiteType["YEAR"] = "YEAR";
    SuiteType["YEAR_ONE"] = "YEAR_ONE";
    SuiteType["YEAR_TWO"] = "YEAR_TWO";
    SuiteType["YEAR_THREE"] = "YEAR_THREE";
    SuiteType["MIXED"] = "MIXED";
    SuiteType["PAST_QUESTIONS"] = "PAST_QUESTIONS";
    SuiteType["CLASS"] = "CLASS";
    SuiteType["TOPIC"] = "TOPIC";
})(SuiteType || (exports.SuiteType = SuiteType = {}));
(0, graphql_1.registerEnumType)(SuiteType, {
    name: 'SuiteType',
    description: 'Suite type — Year-based exam prep, Class level, or Topic focused',
});
let TestSuite = class TestSuite {
};
exports.TestSuite = TestSuite;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TestSuite.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TestSuite.prototype, "title", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TestSuite.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String], { nullable: true }),
    (0, typeorm_1.Column)('text', { array: true, nullable: true }),
    __metadata("design:type", Array)
], TestSuite.prototype, "keywords", void 0);
__decorate([
    (0, graphql_1.Field)(() => SuiteDifficultyType),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: SuiteDifficultyType,
        default: SuiteDifficultyType.BEGINNER,
    }),
    __metadata("design:type", String)
], TestSuite.prototype, "difficulty", void 0);
__decorate([
    (0, graphql_1.Field)(() => SuiteType, { nullable: true }),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: SuiteType,
        nullable: true,
    }),
    __metadata("design:type", String)
], TestSuite.prototype, "suite_type", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TestSuite.prototype, "image_url", void 0);
__decorate([
    (0, graphql_1.Field)(() => [question_entity_1.Question], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => question_entity_1.Question, (question) => question.test_suite),
    __metadata("design:type", Array)
], TestSuite.prototype, "questions", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => version_entity_1.Version, (course) => course.test_suites),
    __metadata("design:type", version_entity_1.Version)
], TestSuite.prototype, "course_version", void 0);
exports.TestSuite = TestSuite = __decorate([
    (0, graphql_1.ObjectType)('TestSuite'),
    (0, typeorm_1.Entity)('test_suites')
], TestSuite);
//# sourceMappingURL=test_suite.entity.js.map