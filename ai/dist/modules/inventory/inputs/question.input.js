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
exports.QuestionInput = void 0;
const graphql_1 = require("@nestjs/graphql");
const question_entity_1 = require("../../review/entities/question.entity");
let QuestionInput = class QuestionInput {
};
exports.QuestionInput = QuestionInput;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], QuestionInput.prototype, "question_number", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], QuestionInput.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String]),
    __metadata("design:type", Array)
], QuestionInput.prototype, "hints", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String]),
    __metadata("design:type", Array)
], QuestionInput.prototype, "solution_steps", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String], { nullable: true }),
    __metadata("design:type", Array)
], QuestionInput.prototype, "options", void 0);
__decorate([
    (0, graphql_1.Field)(() => question_entity_1.QuestionType),
    __metadata("design:type", String)
], QuestionInput.prototype, "type", void 0);
__decorate([
    (0, graphql_1.Field)(() => [question_entity_1.QuestionTagType]),
    __metadata("design:type", Array)
], QuestionInput.prototype, "tags", void 0);
__decorate([
    (0, graphql_1.Field)(() => question_entity_1.QuestionDifficultyType),
    __metadata("design:type", String)
], QuestionInput.prototype, "difficulty", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], QuestionInput.prototype, "estimated_time_in_ms", void 0);
__decorate([
    (0, graphql_1.Field)(() => question_entity_1.QuestionClassLevel, { nullable: true }),
    __metadata("design:type", String)
], QuestionInput.prototype, "class_level", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    __metadata("design:type", Number)
], QuestionInput.prototype, "exam_year", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], QuestionInput.prototype, "correct_answer", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int, { nullable: true }),
    __metadata("design:type", Number)
], QuestionInput.prototype, "marks", void 0);
exports.QuestionInput = QuestionInput = __decorate([
    (0, graphql_1.InputType)()
], QuestionInput);
//# sourceMappingURL=question.input.js.map