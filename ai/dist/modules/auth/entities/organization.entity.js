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
exports.Organization = void 0;
const class_transformer_1 = require("class-transformer");
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const admin_entity_1 = require("./admin.entity");
const category_entity_1 = require("../../inventory/entities/category.entity");
const coupon_entity_1 = require("../../inventory/entities/coupon.entity");
const course_entity_1 = require("../../inventory/entities/course.entity");
const school_demo_entity_1 = require("../../demo/entities/school-demo.entity");
const instructor_entity_1 = require("./instructor.entity");
const review_request_entity_1 = require("../../review/entities/review_request.entity");
const student_entity_1 = require("./student.entity");
let Organization = class Organization {
};
exports.Organization = Organization;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Organization.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Organization.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Organization.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_transformer_1.Exclude)({ toPlainOnly: true }),
    __metadata("design:type", String)
], Organization.prototype, "password", void 0);
__decorate([
    (0, graphql_1.Field)(() => [admin_entity_1.Admin], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => admin_entity_1.Admin, (admin) => admin.organization),
    __metadata("design:type", Array)
], Organization.prototype, "admins", void 0);
__decorate([
    (0, graphql_1.Field)(() => [instructor_entity_1.Instructor], { nullable: true }),
    (0, typeorm_1.ManyToMany)(() => instructor_entity_1.Instructor, (course) => course.organizations),
    __metadata("design:type", Array)
], Organization.prototype, "instructors", void 0);
__decorate([
    (0, graphql_1.Field)(() => [student_entity_1.Student], { nullable: true }),
    (0, typeorm_1.ManyToMany)(() => student_entity_1.Student, (student) => student.organizations),
    __metadata("design:type", Array)
], Organization.prototype, "students", void 0);
__decorate([
    (0, graphql_1.Field)(() => [course_entity_1.Course], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => course_entity_1.Course, (course) => course.organization),
    __metadata("design:type", Array)
], Organization.prototype, "organizational_courses", void 0);
__decorate([
    (0, graphql_1.Field)(() => [category_entity_1.Category], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => category_entity_1.Category, (category) => category.organization),
    __metadata("design:type", Array)
], Organization.prototype, "organizational_categories", void 0);
__decorate([
    (0, graphql_1.Field)(() => [coupon_entity_1.Coupon], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => coupon_entity_1.Coupon, (coupon) => coupon.organization),
    __metadata("design:type", Array)
], Organization.prototype, "organizational_coupons", void 0);
__decorate([
    (0, graphql_1.Field)(() => [review_request_entity_1.ReviewRequest], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => review_request_entity_1.ReviewRequest, (review_req) => review_req.organization),
    __metadata("design:type", Array)
], Organization.prototype, "requested_reviews", void 0);
__decorate([
    (0, graphql_1.Field)(() => school_demo_entity_1.SchoolDemo, { nullable: true }),
    (0, typeorm_1.OneToOne)(() => school_demo_entity_1.SchoolDemo, { nullable: true, eager: false }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", school_demo_entity_1.SchoolDemo)
], Organization.prototype, "school_demo", void 0);
exports.Organization = Organization = __decorate([
    (0, graphql_1.ObjectType)('Organization'),
    (0, typeorm_1.Entity)('organizations')
], Organization);
//# sourceMappingURL=organization.entity.js.map