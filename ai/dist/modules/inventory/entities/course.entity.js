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
exports.Course = exports.CurrencyType = exports.LevelType = exports.DomainType = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const category_entity_1 = require("./category.entity");
const coupon_entity_1 = require("./coupon.entity");
const instructor_entity_1 = require("../../auth/entities/instructor.entity");
const organization_entity_1 = require("../../auth/entities/organization.entity");
const student_entity_1 = require("../../auth/entities/student.entity");
const version_entity_1 = require("../../review/entities/version.entity");
var DomainType;
(function (DomainType) {
    DomainType["SCIENCE"] = "SCIENCE";
    DomainType["ENGLISH"] = "ENGLISH";
    DomainType["MATHEMATICS"] = "MATHEMATICS";
})(DomainType || (exports.DomainType = DomainType = {}));
var LevelType;
(function (LevelType) {
    LevelType["BEGINNER"] = "BEGINNER";
    LevelType["INTERMEDIATE"] = "INTERMEDIATE";
    LevelType["ADVANCED"] = "ADVANCED";
})(LevelType || (exports.LevelType = LevelType = {}));
var CurrencyType;
(function (CurrencyType) {
    CurrencyType["USD"] = "USD";
    CurrencyType["EUR"] = "EUR";
})(CurrencyType || (exports.CurrencyType = CurrencyType = {}));
(0, graphql_1.registerEnumType)(DomainType, {
    name: 'DomainType',
    description: 'Course domains',
});
(0, graphql_1.registerEnumType)(LevelType, {
    name: 'LevelType',
    description: 'Course level',
});
(0, graphql_1.registerEnumType)(CurrencyType, {
    name: 'CurrencyType',
    description: 'Currency',
});
let Course = class Course {
};
exports.Course = Course;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Course.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Course.prototype, "title", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Course.prototype, "avatar_url", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Course.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Course.prototype, "is_mandatory", void 0);
__decorate([
    (0, graphql_1.Field)(() => [DomainType]),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: DomainType,
        array: true,
        default: [DomainType.SCIENCE],
    }),
    __metadata("design:type", Array)
], Course.prototype, "domains", void 0);
__decorate([
    (0, graphql_1.Field)(() => LevelType),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: LevelType,
        default: LevelType.BEGINNER,
    }),
    __metadata("design:type", String)
], Course.prototype, "level", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], Course.prototype, "price", void 0);
__decorate([
    (0, graphql_1.Field)(() => CurrencyType),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CurrencyType,
        default: CurrencyType.USD,
    }),
    __metadata("design:type", String)
], Course.prototype, "currency", void 0);
__decorate([
    (0, graphql_1.Field)(() => [version_entity_1.Version], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => version_entity_1.Version, (version) => version.course),
    __metadata("design:type", Array)
], Course.prototype, "versions", void 0);
__decorate([
    (0, graphql_1.Field)(() => version_entity_1.Version, { nullable: true }),
    (0, typeorm_1.OneToOne)(() => version_entity_1.Version),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", version_entity_1.Version)
], Course.prototype, "approved_version", void 0);
__decorate([
    (0, graphql_1.Field)(() => [coupon_entity_1.Coupon], { nullable: true }),
    (0, typeorm_1.ManyToMany)(() => coupon_entity_1.Coupon),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], Course.prototype, "coupons", void 0);
__decorate([
    (0, graphql_1.Field)(() => [category_entity_1.Category], { nullable: true }),
    (0, typeorm_1.ManyToMany)(() => category_entity_1.Category, (category) => category.courses),
    __metadata("design:type", Array)
], Course.prototype, "categories", void 0);
__decorate([
    (0, graphql_1.Field)(() => [student_entity_1.Student], { nullable: true }),
    (0, typeorm_1.ManyToMany)(() => student_entity_1.Student, (student) => student.subscribed_courses),
    __metadata("design:type", Array)
], Course.prototype, "subscribed_students", void 0);
__decorate([
    (0, graphql_1.Field)(() => organization_entity_1.Organization, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, (organization) => organization.organizational_courses),
    __metadata("design:type", organization_entity_1.Organization)
], Course.prototype, "organization", void 0);
__decorate([
    (0, graphql_1.Field)(() => instructor_entity_1.Instructor, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => instructor_entity_1.Instructor, (instructor) => instructor.created_courses),
    __metadata("design:type", instructor_entity_1.Instructor)
], Course.prototype, "instructor", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Course.prototype, "inserted_at", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Course.prototype, "updated_at", void 0);
exports.Course = Course = __decorate([
    (0, graphql_1.ObjectType)('Course'),
    (0, typeorm_1.Entity)('courses')
], Course);
//# sourceMappingURL=course.entity.js.map