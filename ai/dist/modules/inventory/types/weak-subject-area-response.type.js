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
exports.WeakSubjectAreaResponse = void 0;
const graphql_1 = require("@nestjs/graphql");
const question_entity_1 = require("../../review/entities/question.entity");
let WeakSubjectAreaResponse = class WeakSubjectAreaResponse {
};
exports.WeakSubjectAreaResponse = WeakSubjectAreaResponse;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], WeakSubjectAreaResponse.prototype, "subject", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], WeakSubjectAreaResponse.prototype, "error_count", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], WeakSubjectAreaResponse.prototype, "total", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], WeakSubjectAreaResponse.prototype, "accuracy", void 0);
__decorate([
    (0, graphql_1.Field)(() => [question_entity_1.Question]),
    __metadata("design:type", Array)
], WeakSubjectAreaResponse.prototype, "questions", void 0);
exports.WeakSubjectAreaResponse = WeakSubjectAreaResponse = __decorate([
    (0, graphql_1.ObjectType)('WeakSubjectAreaResponse')
], WeakSubjectAreaResponse);
//# sourceMappingURL=weak-subject-area-response.type.js.map