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
exports.Student = void 0;
const class_transformer_1 = require("class-transformer");
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const cart_entity_1 = require("../../inventory/entities/cart.entity");
const category_entity_1 = require("../../inventory/entities/category.entity");
const checkout_entity_1 = require("../../inventory/entities/checkout.entity");
const course_entity_1 = require("../../inventory/entities/course.entity");
const organization_entity_1 = require("./organization.entity");
const test_entity_1 = require("../../simulation/entities/test.entity");
let Student = class Student {
};
exports.Student = Student;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Student.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Student.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Student.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_transformer_1.Exclude)({ toPlainOnly: true }),
    __metadata("design:type", String)
], Student.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "reset_token", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Student.prototype, "is_setup_completed", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Student.prototype, "is_account_validated", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "validation_code", void 0);
__decorate([
    (0, graphql_1.Field)(() => [course_entity_1.Course], { nullable: true }),
    (0, typeorm_1.ManyToMany)(() => course_entity_1.Course),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], Student.prototype, "subscribed_courses", void 0);
__decorate([
    (0, graphql_1.Field)(() => [category_entity_1.Category], { nullable: true }),
    (0, typeorm_1.ManyToMany)(() => category_entity_1.Category),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], Student.prototype, "subscribed_categories", void 0);
__decorate([
    (0, graphql_1.Field)(() => [organization_entity_1.Organization], { nullable: true }),
    (0, typeorm_1.ManyToMany)(() => organization_entity_1.Organization, (organization) => organization.students),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], Student.prototype, "organizations", void 0);
__decorate([
    (0, graphql_1.Field)(() => [checkout_entity_1.Checkout], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => checkout_entity_1.Checkout, (payment) => payment.student),
    __metadata("design:type", Array)
], Student.prototype, "checkouts", void 0);
__decorate([
    (0, graphql_1.Field)(() => cart_entity_1.Cart, { nullable: true }),
    (0, typeorm_1.OneToOne)(() => cart_entity_1.Cart, (cart) => cart.student),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", cart_entity_1.Cart)
], Student.prototype, "cart", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => test_entity_1.Test, (test) => test.student),
    __metadata("design:type", Array)
], Student.prototype, "tests", void 0);
exports.Student = Student = __decorate([
    (0, graphql_1.ObjectType)('Student'),
    (0, typeorm_1.Entity)('students')
], Student);
//# sourceMappingURL=student.entity.js.map