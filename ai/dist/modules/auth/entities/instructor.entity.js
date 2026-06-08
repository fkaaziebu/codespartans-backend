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
exports.Instructor = exports.InstructorStatusType = void 0;
const class_transformer_1 = require("class-transformer");
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const course_entity_1 = require("../../inventory/entities/course.entity");
const organization_entity_1 = require("./organization.entity");
var InstructorStatusType;
(function (InstructorStatusType) {
    InstructorStatusType["ACTIVE"] = "ACTIVE";
    InstructorStatusType["INACTIVE"] = "INACTIVE";
})(InstructorStatusType || (exports.InstructorStatusType = InstructorStatusType = {}));
(0, graphql_1.registerEnumType)(InstructorStatusType, {
    name: 'InstructorStatusType',
    description: 'Instructor status',
});
let Instructor = class Instructor {
};
exports.Instructor = Instructor;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Instructor.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Instructor.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Instructor.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_transformer_1.Exclude)({ toPlainOnly: true }),
    __metadata("design:type", String)
], Instructor.prototype, "password", void 0);
__decorate([
    (0, graphql_1.Field)(() => InstructorStatusType),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: InstructorStatusType,
        default: InstructorStatusType.ACTIVE,
    }),
    __metadata("design:type", String)
], Instructor.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(() => [organization_entity_1.Organization], { nullable: true }),
    (0, typeorm_1.ManyToMany)(() => organization_entity_1.Organization, (organization) => organization.instructors),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], Instructor.prototype, "organizations", void 0);
__decorate([
    (0, graphql_1.Field)(() => [course_entity_1.Course], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => course_entity_1.Course, (course) => course.instructor),
    __metadata("design:type", Array)
], Instructor.prototype, "created_courses", void 0);
exports.Instructor = Instructor = __decorate([
    (0, graphql_1.ObjectType)('Instructor'),
    (0, typeorm_1.Entity)('instructors')
], Instructor);
//# sourceMappingURL=instructor.entity.js.map