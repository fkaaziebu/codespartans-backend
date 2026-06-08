"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const bullmq_1 = require("@nestjs/bullmq");
const strategies_1 = require("../../helpers/strategies");
const student_entity_1 = require("../auth/entities/student.entity");
const organization_entity_1 = require("../auth/entities/organization.entity");
const cart_entity_1 = require("../inventory/entities/cart.entity");
const category_entity_1 = require("../inventory/entities/category.entity");
const test_entity_1 = require("../simulation/entities/test.entity");
const test_assignment_entity_1 = require("../simulation/entities/test_assignment.entity");
const test_suite_entity_1 = require("../review/entities/test_suite.entity");
const email_consumer_1 = require("../auth/services/email.consumer");
const email_producer_1 = require("../auth/services/email.producer");
const email_service_1 = require("../auth/services/email.service");
const signup_producer_1 = require("../auth/services/signup.producer");
const child_entity_1 = require("./entities/child.entity");
const parent_entity_1 = require("./entities/parent.entity");
const parent_resolver_1 = require("./resolvers/parent.resolver");
const parent_service_1 = require("./services/parent.service");
let ParentModule = class ParentModule {
};
exports.ParentModule = ParentModule;
exports.ParentModule = ParentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            bullmq_1.BullModule.registerQueue({ name: 'email-queue' }, { name: 'signup-queue' }),
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
            typeorm_1.TypeOrmModule.forFeature([parent_entity_1.Parent, child_entity_1.Child, student_entity_1.Student, organization_entity_1.Organization, cart_entity_1.Cart, category_entity_1.Category, test_entity_1.Test, test_assignment_entity_1.TestAssignment, test_suite_entity_1.TestSuite]),
        ],
        providers: [parent_service_1.ParentService, parent_resolver_1.ParentResolver, strategies_1.JwtStrategy, email_producer_1.EmailProducer, email_consumer_1.EmailConsumer, email_service_1.EmailService, signup_producer_1.SignupProducer],
        exports: [typeorm_1.TypeOrmModule],
    })
], ParentModule);
//# sourceMappingURL=parent.module.js.map