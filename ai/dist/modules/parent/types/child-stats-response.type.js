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
exports.ChildStatsResponse = void 0;
const graphql_1 = require("@nestjs/graphql");
let ChildStatsResponse = class ChildStatsResponse {
};
exports.ChildStatsResponse = ChildStatsResponse;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], ChildStatsResponse.prototype, "avg_score", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], ChildStatsResponse.prototype, "avg_score_percent_diff", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], ChildStatsResponse.prototype, "current_streak_count", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], ChildStatsResponse.prototype, "best_streak_count", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], ChildStatsResponse.prototype, "total_questions_done", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], ChildStatsResponse.prototype, "total_questions_percent_diff", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], ChildStatsResponse.prototype, "sessions_this_week", void 0);
exports.ChildStatsResponse = ChildStatsResponse = __decorate([
    (0, graphql_1.ObjectType)('ChildStatsResponse')
], ChildStatsResponse);
//# sourceMappingURL=child-stats-response.type.js.map