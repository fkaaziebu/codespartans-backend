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
exports.StatsResponse = void 0;
const graphql_1 = require("@nestjs/graphql");
let StatsResponse = class StatsResponse {
};
exports.StatsResponse = StatsResponse;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], StatsResponse.prototype, "total_instructors", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], StatsResponse.prototype, "total_admins", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], StatsResponse.prototype, "total_requested_reviews", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], StatsResponse.prototype, "total_assigned_reviews", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], StatsResponse.prototype, "total_completed_reviews", void 0);
exports.StatsResponse = StatsResponse = __decorate([
    (0, graphql_1.ObjectType)('StatsResponse')
], StatsResponse);
//# sourceMappingURL=stats-response.type.js.map