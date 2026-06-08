"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const demo_module_1 = require("../demo/demo.module");
const student_entity_1 = require("../auth/entities/student.entity");
const organization_entity_1 = require("../auth/entities/organization.entity");
const instructor_entity_1 = require("../auth/entities/instructor.entity");
const cart_entity_1 = require("./entities/cart.entity");
const category_entity_1 = require("./entities/category.entity");
const checkout_entity_1 = require("./entities/checkout.entity");
const coupon_entity_1 = require("./entities/coupon.entity");
const course_entity_1 = require("./entities/course.entity");
const test_entity_1 = require("../simulation/entities/test.entity");
const test_suite_entity_1 = require("../review/entities/test_suite.entity");
const strategies_1 = require("../../helpers/strategies");
const resolvers_1 = require("./resolvers");
const services_1 = require("./services");
let InventoryModule = class InventoryModule {
};
exports.InventoryModule = InventoryModule;
exports.InventoryModule = InventoryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
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
                cart_entity_1.Cart,
                category_entity_1.Category,
                checkout_entity_1.Checkout,
                coupon_entity_1.Coupon,
                course_entity_1.Course,
                instructor_entity_1.Instructor,
                organization_entity_1.Organization,
                student_entity_1.Student,
                test_entity_1.Test,
                test_suite_entity_1.TestSuite,
            ]),
        ],
        controllers: [],
        providers: [
            services_1.InstructorService,
            services_1.StudentService,
            services_1.OrganizationService,
            strategies_1.JwtStrategy,
            resolvers_1.InstructorResolver,
            resolvers_1.StudentResolver,
            resolvers_1.OrganizationResolver,
        ],
        exports: [typeorm_1.TypeOrmModule],
    })
], InventoryModule);
//# sourceMappingURL=inventory.module.js.map