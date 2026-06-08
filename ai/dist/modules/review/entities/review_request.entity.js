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
exports.ReviewRequest = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("../../auth/entities/organization.entity");
const version_entity_1 = require("./version.entity");
let ReviewRequest = class ReviewRequest {
};
exports.ReviewRequest = ReviewRequest;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ReviewRequest.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => organization_entity_1.Organization, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, (version) => version.requested_reviews),
    __metadata("design:type", organization_entity_1.Organization)
], ReviewRequest.prototype, "organization", void 0);
__decorate([
    (0, graphql_1.Field)(() => version_entity_1.Version, { nullable: true }),
    (0, typeorm_1.OneToOne)(() => version_entity_1.Version, (version) => version.review_request),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", version_entity_1.Version)
], ReviewRequest.prototype, "course_version", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ReviewRequest.prototype, "inserted_at", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ReviewRequest.prototype, "updated_at", void 0);
exports.ReviewRequest = ReviewRequest = __decorate([
    (0, graphql_1.ObjectType)('ReviewRequest'),
    (0, typeorm_1.Entity)('review_requests')
], ReviewRequest);
//# sourceMappingURL=review_request.entity.js.map