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
exports.StudentSubscription = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const subscription_plan_entity_1 = require("./subscription-plan.entity");
const organization_subscription_entity_1 = require("./organization-subscription.entity");
const student_entity_1 = require("../../auth/entities/student.entity");
let StudentSubscription = class StudentSubscription {
};
exports.StudentSubscription = StudentSubscription;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], StudentSubscription.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => student_entity_1.Student),
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: 'CASCADE' }),
    __metadata("design:type", student_entity_1.Student)
], StudentSubscription.prototype, "student", void 0);
__decorate([
    (0, graphql_1.Field)(() => subscription_plan_entity_1.SubscriptionPlan),
    (0, typeorm_1.ManyToOne)(() => subscription_plan_entity_1.SubscriptionPlan),
    __metadata("design:type", subscription_plan_entity_1.SubscriptionPlan)
], StudentSubscription.prototype, "plan", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ unique: true, nullable: true }),
    __metadata("design:type", String)
], StudentSubscription.prototype, "paystack_reference", void 0);
__decorate([
    (0, graphql_1.Field)(() => organization_subscription_entity_1.SubscriptionStatus),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: organization_subscription_entity_1.SubscriptionStatus,
        default: organization_subscription_entity_1.SubscriptionStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], StudentSubscription.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], StudentSubscription.prototype, "started_at", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], StudentSubscription.prototype, "expires_at", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], StudentSubscription.prototype, "created_at", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], StudentSubscription.prototype, "updated_at", void 0);
exports.StudentSubscription = StudentSubscription = __decorate([
    (0, graphql_1.ObjectType)('StudentSubscription'),
    (0, typeorm_1.Entity)('student_subscriptions')
], StudentSubscription);
//# sourceMappingURL=student-subscription.entity.js.map