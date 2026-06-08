"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const bullmq_1 = require("@nestjs/bullmq");
const strategies_1 = require("../../helpers/strategies");
const organization_entity_1 = require("../auth/entities/organization.entity");
const student_entity_1 = require("../auth/entities/student.entity");
const email_consumer_1 = require("../auth/services/email.consumer");
const email_producer_1 = require("../auth/services/email.producer");
const email_service_1 = require("../auth/services/email.service");
const cart_entity_1 = require("../inventory/entities/cart.entity");
const category_entity_1 = require("../inventory/entities/category.entity");
const school_student_entity_1 = require("./entities/school-student.entity");
const school_resolver_1 = require("./resolvers/school.resolver");
const school_service_1 = require("./services/school.service");
let SchoolModule = class SchoolModule {
};
exports.SchoolModule = SchoolModule;
exports.SchoolModule = SchoolModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            bullmq_1.BullModule.registerQueue({ name: 'email-queue' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (configService) => ({
                    secret: configService.get('JWT_SECRET'),
                    signOptions: { expiresIn: 86400 },
                }),
            }),
            typeorm_1.TypeOrmModule.forFeature([
                school_student_entity_1.SchoolStudent,
                organization_entity_1.Organization,
                student_entity_1.Student,
                cart_entity_1.Cart,
                category_entity_1.Category,
            ]),
        ],
        providers: [
            school_service_1.SchoolService,
            school_resolver_1.SchoolResolver,
            strategies_1.JwtStrategy,
            email_producer_1.EmailProducer,
            email_consumer_1.EmailConsumer,
            email_service_1.EmailService,
        ],
        exports: [typeorm_1.TypeOrmModule],
    })
], SchoolModule);
//# sourceMappingURL=school.module.js.map