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
exports.SubmittedAnswer = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const question_entity_1 = require("../../review/entities/question.entity");
const test_entity_1 = require("./test.entity");
let SubmittedAnswer = class SubmittedAnswer {
};
exports.SubmittedAnswer = SubmittedAnswer;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SubmittedAnswer.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], SubmittedAnswer.prototype, "question_id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SubmittedAnswer.prototype, "answer_provided", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String]),
    (0, typeorm_1.Column)('text', { array: true, default: [] }),
    __metadata("design:type", Array)
], SubmittedAnswer.prototype, "hints_used", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], SubmittedAnswer.prototype, "is_flagged", void 0);
__decorate([
    (0, graphql_1.Field)(() => Boolean, { nullable: true }),
    (0, typeorm_1.Column)({ type: 'boolean', nullable: true, default: null }),
    __metadata("design:type", Boolean)
], SubmittedAnswer.prototype, "is_correct", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], SubmittedAnswer.prototype, "is_marked", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { array: true }),
    __metadata("design:type", Array)
], SubmittedAnswer.prototype, "time_ranges", void 0);
__decorate([
    (0, graphql_1.Field)(() => question_entity_1.Question, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => question_entity_1.Question),
    __metadata("design:type", question_entity_1.Question)
], SubmittedAnswer.prototype, "question", void 0);
__decorate([
    (0, graphql_1.Field)(() => test_entity_1.Test, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => test_entity_1.Test, (test) => test.submitted_answers),
    __metadata("design:type", test_entity_1.Test)
], SubmittedAnswer.prototype, "test", void 0);
exports.SubmittedAnswer = SubmittedAnswer = __decorate([
    (0, graphql_1.ObjectType)('SubmittedAnswer'),
    (0, typeorm_1.Entity)('submitted_answers')
], SubmittedAnswer);
//# sourceMappingURL=sumitted_answer.entity.js.map