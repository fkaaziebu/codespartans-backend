"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationModule = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const demo_module_1 = require("../demo/demo.module");
const student_entity_1 = require("../auth/entities/student.entity");
const child_entity_1 = require("../parent/entities/child.entity");
const strategies_1 = require("../../helpers/strategies");
const recommendation_entity_1 = require("./entities/recommendation.entity");
const sumitted_answer_entity_1 = require("./entities/sumitted_answer.entity");
const test_entity_1 = require("./entities/test.entity");
const test_assignment_entity_1 = require("./entities/test_assignment.entity");
const time_event_entity_1 = require("./entities/time_event.entity");
const student_controller_1 = require("./controllers/student.controller");
const student_gateway_1 = require("./gateways/student.gateway");
const resolvers_1 = require("./resolvers");
const services_1 = require("./services");
const insight_service_1 = require("./services/insight.service");
const mark_answer_consumer_1 = require("./services/mark-answer.consumer");
const mark_answer_producer_1 = require("./services/mark-answer.producer");
const mark_answer_service_1 = require("./services/mark-answer.service");
const test_timer_service_1 = require("./services/test-timer.service");
let SimulationModule = class SimulationModule {
};
exports.SimulationModule = SimulationModule;
exports.SimulationModule = SimulationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            bullmq_1.BullModule.registerQueue({
                name: 'mark-answer-queue',
            }),
            demo_module_1.DemoModule,
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
                child_entity_1.Child,
                recommendation_entity_1.Recommendation,
                student_entity_1.Student,
                sumitted_answer_entity_1.SubmittedAnswer,
                test_entity_1.Test,
                test_assignment_entity_1.TestAssignment,
                time_event_entity_1.TimeEvent,
            ]),
        ],
        controllers: [student_controller_1.StudentController],
        providers: [
            services_1.StudentService,
            insight_service_1.InsightService,
            test_timer_service_1.TestTimerService,
            strategies_1.JwtStrategy,
            resolvers_1.StudentResolver,
            student_gateway_1.StudentGateway,
            mark_answer_producer_1.MarkAnswerProducer,
            mark_answer_service_1.MarkAnswerService,
            mark_answer_consumer_1.MarkAnswerConsumer,
        ],
        exports: [typeorm_1.TypeOrmModule],
    })
], SimulationModule);
//# sourceMappingURL=simulation.module.js.map