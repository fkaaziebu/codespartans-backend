"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const admin_entity_1 = require("../auth/entities/admin.entity");
const instructor_entity_1 = require("../auth/entities/instructor.entity");
const course_entity_1 = require("../inventory/entities/course.entity");
const issue_entity_1 = require("./entities/issue.entity");
const question_entity_1 = require("./entities/question.entity");
const review_entity_1 = require("./entities/review.entity");
const review_request_entity_1 = require("./entities/review_request.entity");
const test_suite_entity_1 = require("./entities/test_suite.entity");
const version_entity_1 = require("./entities/version.entity");
const strategies_1 = require("../../helpers/strategies");
const resolvers_1 = require("./resolvers");
const services_1 = require("./services");
const bullmq_1 = require("@nestjs/bullmq");
let ReviewModule = class ReviewModule {
};
exports.ReviewModule = ReviewModule;
exports.ReviewModule = ReviewModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            bullmq_1.BullModule.registerQueue({
                name: 'meilisearch-queue',
            }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (configService) => ({
                    secret: configService.get('JWT_SECRET'),
                    signOptions: {
                        expiresIn: 86400,
                    },
                }),
            }),
            typeorm_1.TypeOrmModule.forFeature([
                admin_entity_1.Admin,
                course_entity_1.Course,
                instructor_entity_1.Instructor,
                issue_entity_1.Issue,
                question_entity_1.Question,
                review_entity_1.Review,
                review_request_entity_1.ReviewRequest,
                test_suite_entity_1.TestSuite,
                version_entity_1.Version,
            ]),
        ],
        controllers: [],
        providers: [
            services_1.AdminService,
            services_1.InstructorService,
            strategies_1.JwtStrategy,
            resolvers_1.AdminResolver,
            resolvers_1.InstructorResolver,
            services_1.MeilisearchConsumer,
            services_1.MeilisearchProducer,
            services_1.MeilisearchService,
        ],
        exports: [typeorm_1.TypeOrmModule],
    })
], ReviewModule);
//# sourceMappingURL=review.module.js.map