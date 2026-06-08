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
exports.SchoolStudent = void 0;
const class_transformer_1 = require("class-transformer");
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("../../auth/entities/organization.entity");
const student_entity_1 = require("../../auth/entities/student.entity");
const child_entity_1 = require("../../parent/entities/child.entity");
let SchoolStudent = class SchoolStudent {
};
exports.SchoolStudent = SchoolStudent;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SchoolStudent.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SchoolStudent.prototype, "full_name", void 0);
__decorate([
    (0, graphql_1.Field)(() => child_entity_1.ClassLevel),
    (0, typeorm_1.Column)({ type: 'enum', enum: child_entity_1.ClassLevel }),
    __metadata("design:type", String)
], SchoolStudent.prototype, "class_level", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], SchoolStudent.prototype, "target_exam", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ unique: true, nullable: true }),
    __metadata("design:type", String)
], SchoolStudent.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_transformer_1.Exclude)({ toPlainOnly: true }),
    __metadata("design:type", String)
], SchoolStudent.prototype, "pin", void 0);
__decorate([
    (0, graphql_1.Field)(() => organization_entity_1.Organization, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { onDelete: 'CASCADE' }),
    __metadata("design:type", organization_entity_1.Organization)
], SchoolStudent.prototype, "organization", void 0);
__decorate([
    (0, graphql_1.Field)(() => student_entity_1.Student, { nullable: true }),
    (0, typeorm_1.OneToOne)(() => student_entity_1.Student, { nullable: true }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", student_entity_1.Student)
], SchoolStudent.prototype, "student", void 0);
exports.SchoolStudent = SchoolStudent = __decorate([
    (0, graphql_1.ObjectType)('SchoolStudent'),
    (0, typeorm_1.Entity)('school_students')
], SchoolStudent);
//# sourceMappingURL=school-student.entity.js.map