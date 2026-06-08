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
exports.StudentStatsResponse = void 0;
const graphql_1 = require("@nestjs/graphql");
let StudentStatsResponse = class StudentStatsResponse {
};
exports.StudentStatsResponse = StudentStatsResponse;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], StudentStatsResponse.prototype, "total_test_taken", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], StudentStatsResponse.prototype, "total_test_taken_percentage_change", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], StudentStatsResponse.prototype, "average_score", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], StudentStatsResponse.prototype, "average_score_percentage_change", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], StudentStatsResponse.prototype, "study_hours", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], StudentStatsResponse.prototype, "weak_areas_count", void 0);
exports.StudentStatsResponse = StudentStatsResponse = __decorate([
    (0, graphql_1.ObjectType)('StudentStatsResponse')
], StudentStatsResponse);
//# sourceMappingURL=student-stats-response.type.js.map