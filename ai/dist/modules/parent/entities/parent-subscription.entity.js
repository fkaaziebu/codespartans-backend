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
exports.ParentSubscription = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const subscription_plan_entity_1 = require("../../demo/entities/subscription-plan.entity");
const organization_subscription_entity_1 = require("../../demo/entities/organization-subscription.entity");
const parent_entity_1 = require("./parent.entity");
const child_entity_1 = require("./child.entity");
let ParentSubscription = class ParentSubscription {
};
exports.ParentSubscription = ParentSubscription;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ParentSubscription.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => parent_entity_1.Parent),
    (0, typeorm_1.ManyToOne)(() => parent_entity_1.Parent, { onDelete: 'CASCADE' }),
    __metadata("design:type", parent_entity_1.Parent)
], ParentSubscription.prototype, "parent", void 0);
__decorate([
    (0, graphql_1.Field)(() => subscription_plan_entity_1.SubscriptionPlan),
    (0, typeorm_1.ManyToOne)(() => subscription_plan_entity_1.SubscriptionPlan),
    __metadata("design:type", subscription_plan_entity_1.SubscriptionPlan)
], ParentSubscription.prototype, "plan", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ unique: true, nullable: true }),
    __metadata("design:type", String)
], ParentSubscription.prototype, "paystack_reference", void 0);
__decorate([
    (0, graphql_1.Field)(() => organization_subscription_entity_1.SubscriptionStatus),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: organization_subscription_entity_1.SubscriptionStatus,
        default: organization_subscription_entity_1.SubscriptionStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], ParentSubscription.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ParentSubscription.prototype, "started_at", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ParentSubscription.prototype, "expires_at", void 0);
__decorate([
    (0, graphql_1.Field)(() => [child_entity_1.Child], { nullable: true }),
    (0, typeorm_1.ManyToMany)(() => child_entity_1.Child),
    (0, typeorm_1.JoinTable)({
        name: 'parent_subscription_children',
        joinColumn: { name: 'parent_subscription_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'child_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], ParentSubscription.prototype, "children", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ParentSubscription.prototype, "created_at", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ParentSubscription.prototype, "updated_at", void 0);
exports.ParentSubscription = ParentSubscription = __decorate([
    (0, graphql_1.ObjectType)('ParentSubscription'),
    (0, typeorm_1.Entity)('parent_subscriptions')
], ParentSubscription);
//# sourceMappingURL=parent-subscription.entity.js.map