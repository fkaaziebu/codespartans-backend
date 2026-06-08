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
exports.SchoolDemo = exports.DemoStatus = exports.ApproximateStudents = exports.SchoolDemoRole = void 0;
const typeorm_1 = require("typeorm");
const graphql_1 = require("@nestjs/graphql");
var SchoolDemoRole;
(function (SchoolDemoRole) {
    SchoolDemoRole["PROPRIETOR_OWNER"] = "proprietor_owner";
    SchoolDemoRole["HEADMASTER_PRINCIPAL"] = "headmaster_principal";
    SchoolDemoRole["ACADEMIC_DIRECTOR"] = "academic_director";
    SchoolDemoRole["TEACHER"] = "teacher";
    SchoolDemoRole["OTHER"] = "other";
})(SchoolDemoRole || (exports.SchoolDemoRole = SchoolDemoRole = {}));
var ApproximateStudents;
(function (ApproximateStudents) {
    ApproximateStudents["UNDER_50"] = "under_50";
    ApproximateStudents["BETWEEN_50_AND_100"] = "50_to_100";
    ApproximateStudents["BETWEEN_100_AND_300"] = "100_to_300";
    ApproximateStudents["BETWEEN_300_AND_500"] = "300_to_500";
    ApproximateStudents["ABOVE_500"] = "above_500";
})(ApproximateStudents || (exports.ApproximateStudents = ApproximateStudents = {}));
var DemoStatus;
(function (DemoStatus) {
    DemoStatus["PENDING"] = "pending";
    DemoStatus["ACTIVE"] = "active";
    DemoStatus["EXPIRED"] = "expired";
    DemoStatus["CONVERTED"] = "converted";
})(DemoStatus || (exports.DemoStatus = DemoStatus = {}));
(0, graphql_1.registerEnumType)(SchoolDemoRole, { name: 'SchoolDemoRole' });
(0, graphql_1.registerEnumType)(ApproximateStudents, { name: 'ApproximateStudents' });
(0, graphql_1.registerEnumType)(DemoStatus, { name: 'DemoStatus' });
let SchoolDemo = class SchoolDemo {
};
exports.SchoolDemo = SchoolDemo;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SchoolDemo.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SchoolDemo.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SchoolDemo.prototype, "school_name", void 0);
__decorate([
    (0, graphql_1.Field)(() => SchoolDemoRole),
    (0, typeorm_1.Column)({ type: 'enum', enum: SchoolDemoRole }),
    __metadata("design:type", String)
], SchoolDemo.prototype, "role", void 0);
__decorate([
    (0, graphql_1.Field)(() => ApproximateStudents),
    (0, typeorm_1.Column)({ type: 'enum', enum: ApproximateStudents }),
    __metadata("design:type", String)
], SchoolDemo.prototype, "approximate_students", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], SchoolDemo.prototype, "email", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SchoolDemo.prototype, "whatsapp_number", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], SchoolDemo.prototype, "demo_code", void 0);
__decorate([
    (0, graphql_1.Field)(() => DemoStatus),
    (0, typeorm_1.Column)({ type: 'enum', enum: DemoStatus, default: DemoStatus.PENDING }),
    __metadata("design:type", String)
], SchoolDemo.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamptz' }),
    __metadata("design:type", Date)
], SchoolDemo.prototype, "activated_at", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamptz' }),
    __metadata("design:type", Date)
], SchoolDemo.prototype, "expires_at", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ default: 14 }),
    __metadata("design:type", Number)
], SchoolDemo.prototype, "trial_duration_days", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], SchoolDemo.prototype, "created_at", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], SchoolDemo.prototype, "updated_at", void 0);
exports.SchoolDemo = SchoolDemo = __decorate([
    (0, graphql_1.ObjectType)('SchoolDemo'),
    (0, typeorm_1.Entity)('school_demos')
], SchoolDemo);
//# sourceMappingURL=school-demo.entity.js.map