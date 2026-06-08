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
exports.StudentDemoRequest = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const school_demo_entity_1 = require("./school-demo.entity");
let StudentDemoRequest = class StudentDemoRequest {
};
exports.StudentDemoRequest = StudentDemoRequest;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StudentDemoRequest.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StudentDemoRequest.prototype, "full_name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], StudentDemoRequest.prototype, "email", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], StudentDemoRequest.prototype, "demo_code", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StudentDemoRequest.prototype, "target_exam", void 0);
__decorate([
    (0, graphql_1.Field)(() => school_demo_entity_1.DemoStatus),
    (0, typeorm_1.Column)({ type: 'enum', enum: school_demo_entity_1.DemoStatus, default: school_demo_entity_1.DemoStatus.PENDING }),
    __metadata("design:type", String)
], StudentDemoRequest.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamptz' }),
    __metadata("design:type", Date)
], StudentDemoRequest.prototype, "activated_at", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true, type: 'timestamptz' }),
    __metadata("design:type", Date)
], StudentDemoRequest.prototype, "expires_at", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ default: 14 }),
    __metadata("design:type", Number)
], StudentDemoRequest.prototype, "trial_duration_days", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], StudentDemoRequest.prototype, "created_at", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], StudentDemoRequest.prototype, "updated_at", void 0);
exports.StudentDemoRequest = StudentDemoRequest = __decorate([
    (0, graphql_1.ObjectType)('StudentDemoRequest'),
    (0, typeorm_1.Entity)('student_demo_requests')
], StudentDemoRequest);
//# sourceMappingURL=student-demo-request.entity.js.map