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
exports.MeilisearchConsumer = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const meilisearch_service_1 = require("./meilisearch.service");
let MeilisearchConsumer = class MeilisearchConsumer extends bullmq_1.WorkerHost {
    constructor(meilisearchService) {
        super();
        this.meilisearchService = meilisearchService;
    }
    async process(job) {
        switch (job.name) {
            case 'update-meilisearch-documents': {
                await this.meilisearchService.updateMeilisearchDocuments();
                break;
            }
        }
    }
};
exports.MeilisearchConsumer = MeilisearchConsumer;
exports.MeilisearchConsumer = MeilisearchConsumer = __decorate([
    (0, bullmq_1.Processor)('meilisearch-queue'),
    __metadata("design:paramtypes", [meilisearch_service_1.MeilisearchService])
], MeilisearchConsumer);
//# sourceMappingURL=meilisearch.consumer.js.map