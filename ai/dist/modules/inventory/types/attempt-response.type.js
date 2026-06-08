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
exports.AttemptResponse = void 0;
const graphql_1 = require("@nestjs/graphql");
const test_entity_1 = require("../../simulation/entities/test.entity");
let AttemptResponse = class AttemptResponse extends test_entity_1.Test {
};
exports.AttemptResponse = AttemptResponse;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AttemptResponse.prototype, "course_title", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AttemptResponse.prototype, "course_id", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], AttemptResponse.prototype, "score", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], AttemptResponse.prototype, "date_taken", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], AttemptResponse.prototype, "correct", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], AttemptResponse.prototype, "wrong", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], AttemptResponse.prototype, "time_taken", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float, { nullable: true }),
    __metadata("design:type", Number)
], AttemptResponse.prototype, "trend", void 0);
exports.AttemptResponse = AttemptResponse = __decorate([
    (0, graphql_1.ObjectType)('AttemptResponse')
], AttemptResponse);
//# sourceMappingURL=attempt-response.type.js.map