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
exports.Review = exports.ReviewStatusType = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const issue_entity_1 = require("./issue.entity");
const version_entity_1 = require("./version.entity");
var ReviewStatusType;
(function (ReviewStatusType) {
    ReviewStatusType["OPEN"] = "OPEN";
    ReviewStatusType["CLOSED"] = "CLOSED";
})(ReviewStatusType || (exports.ReviewStatusType = ReviewStatusType = {}));
(0, graphql_1.registerEnumType)(ReviewStatusType, {
    name: 'ReviewStatusType',
    description: 'Review status',
});
let Review = class Review {
};
exports.Review = Review;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Review.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Review.prototype, "title", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Review.prototype, "message", void 0);
__decorate([
    (0, graphql_1.Field)(() => ReviewStatusType),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ReviewStatusType,
        default: ReviewStatusType.OPEN,
    }),
    __metadata("design:type", String)
], Review.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(() => version_entity_1.Version, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => version_entity_1.Version, (version) => version.reviews),
    __metadata("design:type", version_entity_1.Version)
], Review.prototype, "course_version", void 0);
__decorate([
    (0, graphql_1.Field)(() => [issue_entity_1.Issue], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => issue_entity_1.Issue, (issue) => issue.review),
    __metadata("design:type", Array)
], Review.prototype, "issues", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Review.prototype, "inserted_at", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Review.prototype, "updated_at", void 0);
exports.Review = Review = __decorate([
    (0, graphql_1.ObjectType)('Review'),
    (0, typeorm_1.Entity)('reviews')
], Review);
//# sourceMappingURL=review.entity.js.map