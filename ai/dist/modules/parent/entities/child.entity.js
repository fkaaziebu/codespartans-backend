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
exports.Child = exports.ClassLevel = void 0;
const class_transformer_1 = require("class-transformer");
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("../../auth/entities/student.entity");
const parent_entity_1 = require("./parent.entity");
var ClassLevel;
(function (ClassLevel) {
    ClassLevel["JHS1"] = "JHS1";
    ClassLevel["JHS2"] = "JHS2";
    ClassLevel["JHS3"] = "JHS3";
    ClassLevel["SHS1"] = "SHS1";
    ClassLevel["SHS2"] = "SHS2";
    ClassLevel["SHS3"] = "SHS3";
})(ClassLevel || (exports.ClassLevel = ClassLevel = {}));
(0, graphql_1.registerEnumType)(ClassLevel, {
    name: 'ClassLevel',
    description: 'Student class level',
});
let Child = class Child {
};
exports.Child = Child;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Child.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Child.prototype, "full_name", void 0);
__decorate([
    (0, graphql_1.Field)(() => ClassLevel),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ClassLevel,
    }),
    __metadata("design:type", String)
], Child.prototype, "class_level", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Child.prototype, "target_exam", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Child.prototype, "school_name", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ unique: true, nullable: true }),
    __metadata("design:type", String)
], Child.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_transformer_1.Exclude)({ toPlainOnly: true }),
    __metadata("design:type", String)
], Child.prototype, "pin", void 0);
__decorate([
    (0, graphql_1.Field)(() => parent_entity_1.Parent, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => parent_entity_1.Parent, (parent) => parent.children),
    __metadata("design:type", parent_entity_1.Parent)
], Child.prototype, "parent", void 0);
__decorate([
    (0, graphql_1.Field)(() => student_entity_1.Student, { nullable: true }),
    (0, typeorm_1.OneToOne)(() => student_entity_1.Student, { nullable: true }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", student_entity_1.Student)
], Child.prototype, "student", void 0);
exports.Child = Child = __decorate([
    (0, graphql_1.ObjectType)('Child'),
    (0, typeorm_1.Entity)('children')
], Child);
//# sourceMappingURL=child.entity.js.map