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
var InsightService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const sdk_1 = require("@anthropic-ai/sdk");
const typeorm_2 = require("typeorm");
const student_entity_1 = require("../../auth/entities/student.entity");
const test_entity_1 = require("../entities/test.entity");
const time_event_entity_1 = require("../entities/time_event.entity");
let InsightService = InsightService_1 = class InsightService {
    constructor(studentRepository, testRepository, configService) {
        this.studentRepository = studentRepository;
        this.testRepository = testRepository;
        this.configService = configService;
        this.logger = new common_1.Logger(InsightService_1.name);
        this.anthropic = new sdk_1.default({
            apiKey: this.configService.get('ANTHROPIC_API_KEY'),
        });
    }
    async getWeeklyInsight({ email }) {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        weekStart.setHours(0, 0, 0, 0);
        const student = await this.studentRepository.findOne({ where: { email } });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const tests = await this.testRepository
            .createQueryBuilder('test')
            .innerJoinAndSelect('test.test_suite', 'suite')
            .innerJoinAndSelect('test.submitted_answers', 'answer')
            .innerJoin('test.time_events', 'te', 'te.type = :started AND te.recorded_at >= :weekStart', { started: time_event_entity_1.TimeEventType.STARTED, weekStart })
            .where('test.student = :studentId', { studentId: student.id })
            .andWhere('test.status = :status', { status: test_entity_1.TestStatusType.ENDED })
            .getMany();
        if (!tests.length) {
            throw new common_1.NotFoundException('No completed tests found for this week');
        }
        const suiteMap = new Map();
        for (const test of tests) {
            const { id: suite_id, title } = test.test_suite;
            if (!suiteMap.has(suite_id)) {
                suiteMap.set(suite_id, {
                    suite_id,
                    title: title ?? 'Untitled Suite',
                    correct: 0,
                    total: 0,
                });
            }
            const agg = suiteMap.get(suite_id);
            for (const answer of test.submitted_answers) {
                if (!answer.is_marked)
                    continue;
                agg.total += 1;
                if (answer.is_correct === true)
                    agg.correct += 1;
            }
        }
        const suiteStats = Array.from(suiteMap.values()).map((agg) => ({
            suite_id: agg.suite_id,
            title: agg.title,
            correct: agg.correct,
            total: agg.total,
            accuracy: agg.total > 0
                ? Math.round((agg.correct / agg.total) * 10000) / 100
                : 0,
        }));
        const prompt = `You are an educational AI coach. A student completed the following test suites this week.
Identify their single biggest struggle area and produce a motivating insight card.

Suite performance:
${JSON.stringify(suiteStats, null, 2)}

Rules:
- title: one short sentence — "You're struggling with [Suite] — your accuracy dropped to X%"
- description: 2 sentences max, reference specific numbers, end with an action prompt
- suites: ALL suites sorted by accuracy ascending (worst first), each as {suite_id, title, accuracy}

Respond with only a raw JSON object — no markdown, no code fences, no extra keys:
{"title": "...", "description": "...", "suites": [{"suite_id": "...", "title": "...", "accuracy": 0.0}]}`;
        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 512,
                messages: [
                    { role: 'user', content: prompt },
                    { role: 'assistant', content: '{' },
                ],
            });
            const raw = response.content[0].type === 'text' ? response.content[0].text : '';
            const text = ('{' + raw).replace(/```[a-z]*\n?/gi, '').trim();
            const result = JSON.parse(text);
            this.logger.log(`Generated weekly insight for ${email}`);
            return result;
        }
        catch (err) {
            this.logger.error(`Failed to generate weekly insight for ${email}: ${err.message}`);
            throw new common_1.BadRequestException('Failed to generate weekly insight');
        }
    }
};
exports.InsightService = InsightService;
exports.InsightService = InsightService = InsightService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(1, (0, typeorm_1.InjectRepository)(test_entity_1.Test)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], InsightService);
//# sourceMappingURL=insight.service.js.map