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
exports.Test = exports.TestModeType = exports.TestStatusType = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const recommendation_entity_1 = require("./recommendation.entity");
const student_entity_1 = require("../../auth/entities/student.entity");
const sumitted_answer_entity_1 = require("./sumitted_answer.entity");
const test_suite_entity_1 = require("../../review/entities/test_suite.entity");
const time_event_entity_1 = require("./time_event.entity");
const test_assignment_entity_1 = require("./test_assignment.entity");
var TestStatusType;
(function (TestStatusType) {
    TestStatusType["ON_GOING"] = "ON_GOING";
    TestStatusType["PAUSED"] = "PAUSED";
    TestStatusType["ENDED"] = "ENDED";
})(TestStatusType || (exports.TestStatusType = TestStatusType = {}));
var TestModeType;
(function (TestModeType) {
    TestModeType["PROCTURED"] = "PROCTURED";
    TestModeType["UN_PROCTURED"] = "UN_PROCTURED";
})(TestModeType || (exports.TestModeType = TestModeType = {}));
(0, graphql_1.registerEnumType)(TestStatusType, {
    name: 'TestStatusType',
    description: 'Test status',
});
(0, graphql_1.registerEnumType)(TestModeType, {
    name: 'TestModeType',
    description: 'Test mode',
});
let Test = class Test {
};
exports.Test = Test;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Test.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => TestStatusType),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TestStatusType,
        default: TestStatusType.ON_GOING,
    }),
    __metadata("design:type", String)
], Test.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(() => TestModeType),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TestModeType,
        default: TestModeType.PROCTURED,
    }),
    __metadata("design:type", String)
], Test.prototype, "mode", void 0);
__decorate([
    (0, graphql_1.Field)(() => test_suite_entity_1.TestSuite, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => test_suite_entity_1.TestSuite),
    __metadata("design:type", test_suite_entity_1.TestSuite)
], Test.prototype, "test_suite", void 0);
__decorate([
    (0, graphql_1.Field)(() => [sumitted_answer_entity_1.SubmittedAnswer], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => sumitted_answer_entity_1.SubmittedAnswer, (submittedAnswer) => submittedAnswer.test),
    __metadata("design:type", Array)
], Test.prototype, "submitted_answers", void 0);
__decorate([
    (0, graphql_1.Field)(() => [time_event_entity_1.TimeEvent], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => time_event_entity_1.TimeEvent, (time_event) => time_event.test),
    __metadata("design:type", Array)
], Test.prototype, "time_events", void 0);
__decorate([
    (0, graphql_1.Field)(() => [recommendation_entity_1.Recommendation], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => recommendation_entity_1.Recommendation, (recommendation) => recommendation.test),
    __metadata("design:type", Array)
], Test.prototype, "recommendations", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], Test.prototype, "course_id", void 0);
__decorate([
    (0, graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], Test.prototype, "course_category", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, (student) => student.tests),
    __metadata("design:type", student_entity_1.Student)
], Test.prototype, "student", void 0);
__decorate([
    (0, graphql_1.Field)(() => test_assignment_entity_1.TestAssignment, { nullable: true }),
    (0, typeorm_1.OneToOne)(() => test_assignment_entity_1.TestAssignment, (assignment) => assignment.test, {
        nullable: true,
    }),
    __metadata("design:type", test_assignment_entity_1.TestAssignment)
], Test.prototype, "assignment", void 0);
exports.Test = Test = __decorate([
    (0, graphql_1.ObjectType)('Test'),
    (0, typeorm_1.Entity)('tests')
], Test);
//# sourceMappingURL=test.entity.js.map