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
exports.Issue = exports.IssueStatusType = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const review_entity_1 = require("./review.entity");
var IssueStatusType;
(function (IssueStatusType) {
    IssueStatusType["OPEN"] = "OPEN";
    IssueStatusType["IN_PROGRESS"] = "IN_PROGRESS";
    IssueStatusType["RESOLVED"] = "RESOLVED";
    IssueStatusType["CLOSED"] = "CLOSED";
})(IssueStatusType || (exports.IssueStatusType = IssueStatusType = {}));
(0, graphql_1.registerEnumType)(IssueStatusType, {
    name: 'IssueStatusType',
    description: 'Issue status',
});
let Issue = class Issue {
};
exports.Issue = Issue;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Issue.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Issue.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(() => IssueStatusType),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: IssueStatusType,
        default: IssueStatusType.OPEN,
    }),
    __metadata("design:type", String)
], Issue.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ default: null }),
    __metadata("design:type", String)
], Issue.prototype, "response", void 0);
__decorate([
    (0, graphql_1.Field)(() => review_entity_1.Review, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => review_entity_1.Review, (review) => review.issues),
    __metadata("design:type", review_entity_1.Review)
], Issue.prototype, "review", void 0);
exports.Issue = Issue = __decorate([
    (0, graphql_1.ObjectType)('Issue'),
    (0, typeorm_1.Entity)('issues')
], Issue);
//# sourceMappingURL=issue.entity.js.map