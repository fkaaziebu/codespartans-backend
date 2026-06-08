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
var MeilisearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeilisearchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const course_entity_1 = require("../../inventory/entities/course.entity");
const typeorm_2 = require("typeorm");
const meilisearch_1 = require("meilisearch");
const config_1 = require("@nestjs/config");
let MeilisearchService = MeilisearchService_1 = class MeilisearchService {
    constructor(courseRepository, configService) {
        this.courseRepository = courseRepository;
        this.configService = configService;
        this.logger = new common_1.Logger(MeilisearchService_1.name);
        this.client = null;
        this.client = new meilisearch_1.Meilisearch({
            host: configService.get('MEILI_URL'),
            apiKey: configService.get('MEILI_MASTER_KEY'),
        });
    }
    async updateMeilisearchDocuments() {
        return this.courseRepository.manager.transaction(async (transactionalEntityManager) => {
            const courses = await transactionalEntityManager.find(course_entity_1.Course, {
                where: {
                    approved_version: true,
                },
                relations: ['categories', 'instructor'],
            });
            const index = this.client.index(this.configService.get('MEILI_INDEX'));
            const response = await index.addDocuments(courses);
            this.logger.log(`MEILISEARCH: ${response}`);
        });
    }
};
exports.MeilisearchService = MeilisearchService;
exports.MeilisearchService = MeilisearchService = MeilisearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(course_entity_1.Course)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], MeilisearchService);
//# sourceMappingURL=meilisearch.service.js.map