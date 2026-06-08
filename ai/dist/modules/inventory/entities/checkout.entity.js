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
exports.Checkout = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const category_entity_1 = require("./category.entity");
const course_entity_1 = require("./course.entity");
const student_entity_1 = require("../../auth/entities/student.entity");
let Checkout = class Checkout {
};
exports.Checkout = Checkout;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Checkout.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => student_entity_1.Student, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, (student) => student.checkouts),
    __metadata("design:type", student_entity_1.Student)
], Checkout.prototype, "student", void 0);
__decorate([
    (0, graphql_1.Field)(() => [course_entity_1.Course], { nullable: true }),
    (0, typeorm_1.ManyToMany)(() => course_entity_1.Course),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], Checkout.prototype, "courses", void 0);
__decorate([
    (0, graphql_1.Field)(() => [category_entity_1.Category], { nullable: true }),
    (0, typeorm_1.ManyToMany)(() => category_entity_1.Category),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], Checkout.prototype, "categories", void 0);
exports.Checkout = Checkout = __decorate([
    (0, graphql_1.ObjectType)('Checkout'),
    (0, typeorm_1.Entity)('checkouts')
], Checkout);
//# sourceMappingURL=checkout.entity.js.map