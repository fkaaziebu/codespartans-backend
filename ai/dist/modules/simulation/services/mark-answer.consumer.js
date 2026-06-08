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
exports.MarkAnswerConsumer = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const mark_answer_service_1 = require("./mark-answer.service");
let MarkAnswerConsumer = class MarkAnswerConsumer extends bullmq_1.WorkerHost {
    constructor(markAnswerService) {
        super();
        this.markAnswerService = markAnswerService;
    }
    async process(job) {
        switch (job.name) {
            case 'mark-short-answer': {
                const { submittedAnswerId } = job.data;
                await this.markAnswerService.markShortAnswer(submittedAnswerId);
                break;
            }
        }
    }
};
exports.MarkAnswerConsumer = MarkAnswerConsumer;
exports.MarkAnswerConsumer = MarkAnswerConsumer = __decorate([
    (0, bullmq_1.Processor)('mark-answer-queue'),
    __metadata("design:paramtypes", [mark_answer_service_1.MarkAnswerService])
], MarkAnswerConsumer);
//# sourceMappingURL=mark-answer.consumer.js.map