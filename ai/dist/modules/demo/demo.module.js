"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const cart_entity_1 = require("../inventory/entities/cart.entity");
const organization_entity_1 = require("../auth/entities/organization.entity");
const auth_module_1 = require("../auth/auth.module");
const subscription_guard_1 = require("../../helpers/guards/subscription.guard");
const organization_subscription_entity_1 = require("./entities/organization-subscription.entity");
const parent_demo_request_entity_1 = require("./entities/parent-demo-request.entity");
const school_demo_entity_1 = require("./entities/school-demo.entity");
const student_demo_request_entity_1 = require("./entities/student-demo-request.entity");
const student_subscription_entity_1 = require("./entities/student-subscription.entity");
const subscription_plan_entity_1 = require("./entities/subscription-plan.entity");
const payment_controller_1 = require("./controllers/payment.controller");
const demo_resolver_1 = require("./resolvers/demo.resolver");
const demo_service_1 = require("./services/demo.service");
const payment_service_1 = require("./services/payment.service");
const student_entity_1 = require("../auth/entities/student.entity");
const parent_entity_1 = require("../parent/entities/parent.entity");
const child_entity_1 = require("../parent/entities/child.entity");
const parent_subscription_entity_1 = require("../parent/entities/parent-subscription.entity");
const email_consumer_1 = require("../auth/services/email.consumer");
const email_producer_1 = require("../auth/services/email.producer");
const email_service_1 = require("../auth/services/email.service");
const signup_consumer_1 = require("./services/signup.consumer");
const bullmq_1 = require("@nestjs/bullmq");
let DemoModule = class DemoModule {
};
exports.DemoModule = DemoModule;
exports.DemoModule = DemoModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            bullmq_1.BullModule.registerQueue({ name: 'email-queue' }, { name: 'signup-queue' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (configService) => ({
                    secret: configService.get('JWT_SECRET'),
                    signOptions: { expiresIn: 86400 },
                }),
            }),
            typeorm_1.TypeOrmModule.forFeature([
                school_demo_entity_1.SchoolDemo,
                parent_demo_request_entity_1.ParentDemoRequest,
                student_demo_request_entity_1.StudentDemoRequest,
                subscription_plan_entity_1.SubscriptionPlan,
                organization_subscription_entity_1.OrgSubscription,
                parent_subscription_entity_1.ParentSubscription,
                student_subscription_entity_1.StudentSubscription,
                cart_entity_1.Cart,
                organization_entity_1.Organization,
                student_entity_1.Student,
                parent_entity_1.Parent,
                child_entity_1.Child,
            ]),
            auth_module_1.AuthModule,
        ],
        controllers: [payment_controller_1.PaymentController],
        providers: [
            demo_resolver_1.DemoResolver,
            demo_service_1.DemoService,
            payment_service_1.PaymentService,
            subscription_guard_1.SubscriptionGuard,
            email_producer_1.EmailProducer,
            email_consumer_1.EmailConsumer,
            email_service_1.EmailService,
            signup_consumer_1.SignupConsumer,
        ],
        exports: [typeorm_1.TypeOrmModule, subscription_guard_1.SubscriptionGuard],
    })
], DemoModule);
//# sourceMappingURL=demo.module.js.map