"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const admin_entity_1 = require("./entities/admin.entity");
const instructor_entity_1 = require("./entities/instructor.entity");
const organization_entity_1 = require("./entities/organization.entity");
const student_entity_1 = require("./entities/student.entity");
const strategies_1 = require("../../helpers/strategies");
const resolvers_1 = require("./resolvers");
const services_1 = require("./services");
const bullmq_1 = require("@nestjs/bullmq");
const email_producer_1 = require("./services/email.producer");
const email_consumer_1 = require("./services/email.consumer");
const email_service_1 = require("./services/email.service");
const signup_producer_1 = require("./services/signup.producer");
const student_controller_1 = require("./controllers/student.controller");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
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
            typeorm_1.TypeOrmModule.forFeature([admin_entity_1.Admin, instructor_entity_1.Instructor, organization_entity_1.Organization, student_entity_1.Student]),
        ],
        controllers: [student_controller_1.StudentController],
        providers: [
            email_producer_1.EmailProducer,
            email_consumer_1.EmailConsumer,
            email_service_1.EmailService,
            signup_producer_1.SignupProducer,
            services_1.AdminService,
            services_1.InstructorService,
            services_1.StudentService,
            services_1.OrganizationService,
            strategies_1.JwtStrategy,
            strategies_1.GoogleStrategy,
            resolvers_1.AdminResolver,
            resolvers_1.InstructorResolver,
            resolvers_1.StudentResolver,
            resolvers_1.OrganizationResolver,
        ],
        exports: [typeorm_1.TypeOrmModule, email_producer_1.EmailProducer, signup_producer_1.SignupProducer],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map