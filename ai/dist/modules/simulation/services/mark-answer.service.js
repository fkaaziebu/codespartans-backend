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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MarkAnswerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkAnswerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const sdk_1 = require("@anthropic-ai/sdk");
const typeorm_2 = require("typeorm");
const sumitted_answer_entity_1 = require("../entities/sumitted_answer.entity");
let MarkAnswerService = MarkAnswerService_1 = class MarkAnswerService {
    constructor(submittedAnswerRepository, configService) {
        this.submittedAnswerRepository = submittedAnswerRepository;
        this.configService = configService;
        this.logger = new common_1.Logger(MarkAnswerService_1.name);
        this.anthropic = new sdk_1.default({
            apiKey: this.configService.get('ANTHROPIC_API_KEY'),
        });
    }
    async markShortAnswer(submittedAnswerId) {
        const submittedAnswer = await this.submittedAnswerRepository.findOne({
            where: { id: submittedAnswerId },
            relations: ['question'],
        });
        if (!submittedAnswer) {
            this.logger.warn(`SubmittedAnswer ${submittedAnswerId} not found`);
            return submittedAnswer;
        }
        const { question, answer_provided } = submittedAnswer;
        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 256,
                messages: [
                    {
                        role: 'user',
                        content: `You are an exam marker. Determine if the student's answer is correct based on the question and expected answer. Be flexible with phrasing, synonyms, and partial credit where appropriate.

Question: ${question.description}
Expected Answer: ${question.correct_answer}
Student's Answer: ${answer_provided}

Respond with only a raw JSON object using exactly this shape — no markdown, no code fences, no extra keys: {"is_correct": true} or {"is_correct": false}`,
                    },
                    {
                        role: 'assistant',
                        content: '{',
                    },
                ],
            });
            const raw = response.content[0].type === 'text' ? response.content[0].text : '';
            const text = ('{' + raw).replace(/```[a-z]*\n?/gi, '').trim();
            const result = JSON.parse(text);
            const is_correct = result.is_correct ?? result.correct ?? false;
            submittedAnswer.is_correct = is_correct;
            submittedAnswer.is_marked = true;
            console.log('RESULT:', result);
            const final_result = await this.submittedAnswerRepository.save(submittedAnswer);
            console.log('FINAL_RESULT:', final_result);
            this.logger.log(`Marked answer ${submittedAnswerId}: is_correct=${is_correct}`);
            return final_result;
        }
        catch (err) {
            this.logger.error(`Failed to mark answer ${submittedAnswerId}: ${err.message}`);
            return submittedAnswer;
        }
    }
};
exports.MarkAnswerService = MarkAnswerService;
exports.MarkAnswerService = MarkAnswerService = MarkAnswerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sumitted_answer_entity_1.SubmittedAnswer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], MarkAnswerService);
//# sourceMappingURL=mark-answer.service.js.map