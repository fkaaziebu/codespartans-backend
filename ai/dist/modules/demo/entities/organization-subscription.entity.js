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
exports.OrgSubscription = exports.SubscriptionStatus = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("../../auth/entities/organization.entity");
const subscription_plan_entity_1 = require("./subscription-plan.entity");
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["EXPIRED"] = "expired";
    SubscriptionStatus["CANCELLED"] = "cancelled";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
(0, graphql_1.registerEnumType)(SubscriptionStatus, { name: 'SubscriptionStatus' });
let OrgSubscription = class OrgSubscription {
};
exports.OrgSubscription = OrgSubscription;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], OrgSubscription.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => organization_entity_1.Organization),
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { onDelete: 'CASCADE' }),
    __metadata("design:type", organization_entity_1.Organization)
], OrgSubscription.prototype, "organization", void 0);
__decorate([
    (0, graphql_1.Field)(() => subscription_plan_entity_1.SubscriptionPlan),
    (0, typeorm_1.ManyToOne)(() => subscription_plan_entity_1.SubscriptionPlan),
    __metadata("design:type", subscription_plan_entity_1.SubscriptionPlan)
], OrgSubscription.prototype, "plan", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ unique: true, nullable: true }),
    __metadata("design:type", String)
], OrgSubscription.prototype, "paystack_reference", void 0);
__decorate([
    (0, graphql_1.Field)(() => SubscriptionStatus),
    (0, typeorm_1.Column)({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE }),
    __metadata("design:type", String)
], OrgSubscription.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], OrgSubscription.prototype, "started_at", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], OrgSubscription.prototype, "expires_at", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], OrgSubscription.prototype, "created_at", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], OrgSubscription.prototype, "updated_at", void 0);
exports.OrgSubscription = OrgSubscription = __decorate([
    (0, graphql_1.ObjectType)('OrgSubscription'),
    (0, typeorm_1.Entity)('organization_subscriptions')
], OrgSubscription);
//# sourceMappingURL=organization-subscription.entity.js.map