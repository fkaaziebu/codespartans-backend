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
exports.Category = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const course_entity_1 = require("./course.entity");
const organization_entity_1 = require("../../auth/entities/organization.entity");
const student_entity_1 = require("../../auth/entities/student.entity");
let Category = class Category {
};
exports.Category = Category;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Category.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Category.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Category.prototype, "avatar_url", void 0);
__decorate([
    (0, graphql_1.Field)(() => organization_entity_1.Organization, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, (organization) => organization.organizational_categories),
    __metadata("design:type", organization_entity_1.Organization)
], Category.prototype, "organization", void 0);
__decorate([
    (0, graphql_1.Field)(() => [student_entity_1.Student], { nullable: true }),
    (0, typeorm_1.ManyToMany)(() => student_entity_1.Student, (student) => student.subscribed_categories),
    __metadata("design:type", Array)
], Category.prototype, "subscribed_students", void 0);
__decorate([
    (0, graphql_1.Field)(() => [course_entity_1.Course], { nullable: true }),
    (0, typeorm_1.ManyToMany)(() => course_entity_1.Course, (course) => course.categories),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], Category.prototype, "courses", void 0);
exports.Category = Category = __decorate([
    (0, graphql_1.ObjectType)('Category'),
    (0, typeorm_1.Entity)('categories')
], Category);
//# sourceMappingURL=category.entity.js.map