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
exports.TestAssignment = exports.TestAssignmentStatus = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const child_entity_1 = require("../../parent/entities/child.entity");
const parent_entity_1 = require("../../parent/entities/parent.entity");
const test_suite_entity_1 = require("../../review/entities/test_suite.entity");
const test_entity_1 = require("./test.entity");
var TestAssignmentStatus;
(function (TestAssignmentStatus) {
    TestAssignmentStatus["PENDING"] = "PENDING";
    TestAssignmentStatus["COMPLETED"] = "COMPLETED";
})(TestAssignmentStatus || (exports.TestAssignmentStatus = TestAssignmentStatus = {}));
(0, graphql_1.registerEnumType)(TestAssignmentStatus, {
    name: 'TestAssignmentStatus',
    description: 'Test assignment status',
});
let TestAssignment = class TestAssignment {
};
exports.TestAssignment = TestAssignment;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TestAssignment.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => TestAssignmentStatus),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TestAssignmentStatus,
        default: TestAssignmentStatus.PENDING,
    }),
    __metadata("design:type", String)
], TestAssignment.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TestAssignment.prototype, "assigned_at", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], TestAssignment.prototype, "completed_at", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], TestAssignment.prototype, "note", void 0);
__decorate([
    (0, graphql_1.Field)(() => parent_entity_1.Parent, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => parent_entity_1.Parent),
    __metadata("design:type", parent_entity_1.Parent)
], TestAssignment.prototype, "parent", void 0);
__decorate([
    (0, graphql_1.Field)(() => child_entity_1.Child, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => child_entity_1.Child),
    __metadata("design:type", child_entity_1.Child)
], TestAssignment.prototype, "child", void 0);
__decorate([
    (0, graphql_1.Field)(() => test_suite_entity_1.TestSuite, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => test_suite_entity_1.TestSuite),
    __metadata("design:type", test_suite_entity_1.TestSuite)
], TestAssignment.prototype, "test_suite", void 0);
__decorate([
    (0, graphql_1.Field)(() => test_entity_1.Test, { nullable: true }),
    (0, typeorm_1.OneToOne)(() => test_entity_1.Test, { nullable: true }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", test_entity_1.Test)
], TestAssignment.prototype, "test", void 0);
exports.TestAssignment = TestAssignment = __decorate([
    (0, graphql_1.ObjectType)('TestAssignment'),
    (0, typeorm_1.Entity)('test_assignments')
], TestAssignment);
//# sourceMappingURL=test_assignment.entity.js.map