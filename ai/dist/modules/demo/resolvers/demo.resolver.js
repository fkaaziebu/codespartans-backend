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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoResolver = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const guards_1 = require("../../../helpers/guards");
const activate_parent_demo_input_1 = require("../inputs/activate-parent-demo.input");
const activate_school_demo_input_1 = require("../inputs/activate-school-demo.input");
const activate_student_demo_input_1 = require("../inputs/activate-student-demo.input");
const book_parent_free_demo_input_1 = require("../inputs/book-parent-free-demo.input");
const book_school_free_demo_input_1 = require("../inputs/book-school-free-demo.input");
const book_student_free_demo_input_1 = require("../inputs/book-student-free-demo.input");
const subscription_plan_entity_1 = require("../entities/subscription-plan.entity");
const demo_service_1 = require("../services/demo.service");
const activate_demo_response_type_1 = require("../types/activate-demo-response.type");
const book_demo_response_type_1 = require("../types/book-demo-response.type");
const initiate_payment_response_type_1 = require("../types/initiate-payment-response.type");
const types_1 = require("../../parent/types");
const types_2 = require("../../auth/types");
const parent_subscription_entity_1 = require("../../parent/entities/parent-subscription.entity");
const student_subscription_entity_1 = require("../entities/student-subscription.entity");
let DemoResolver = class DemoResolver {
    constructor(demoService) {
        this.demoService = demoService;
    }
    async bookSchoolFreeDemo(input) {
        return this.demoService.bookSchoolFreeDemo(input);
    }
    async bookParentFreeDemo(input) {
        return this.demoService.bookParentFreeDemo(input);
    }
    async bookStudentFreeDemo(input) {
        return this.demoService.bookStudentFreeDemo(input);
    }
    async activateSchoolDemo(input) {
        return this.demoService.activateSchoolDemo(input);
    }
    async activateStudentDemo(input) {
        return this.demoService.activateStudentDemo(input);
    }
    async activateParentDemo(input) {
        return this.demoService.activateParentDemo(input);
    }
    async listSubscriptionPlans() {
        return this.demoService.listPlans();
    }
    async initiatePayment(planId, children, context) {
        const { email, role } = context.req.user;
        return this.demoService.initiatePayment(email, planId, role, children);
    }
    async getMySubscription(context) {
        const { email } = context.req.user;
        return this.demoService.getMySubscription(email);
    }
    async listMySubscriptions(context) {
        const { email } = context.req.user;
        return this.demoService.listMySubscriptions(email);
    }
    async getMyStudentSubscription(context) {
        const { email } = context.req.user;
        return this.demoService.getMyStudentSubscription(email);
    }
    async listMyStudentSubscriptions(context) {
        const { email } = context.req.user;
        return this.demoService.listMyStudentSubscriptions(email);
    }
};
exports.DemoResolver = DemoResolver;
__decorate([
    (0, graphql_1.Mutation)(() => book_demo_response_type_1.BookDemoResponse),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [book_school_free_demo_input_1.BookSchoolFreeDemoInput]),
    __metadata("design:returntype", Promise)
], DemoResolver.prototype, "bookSchoolFreeDemo", null);
__decorate([
    (0, graphql_1.Mutation)(() => book_demo_response_type_1.BookDemoResponse),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [book_parent_free_demo_input_1.BookParentFreeDemoInput]),
    __metadata("design:returntype", Promise)
], DemoResolver.prototype, "bookParentFreeDemo", null);
__decorate([
    (0, graphql_1.Mutation)(() => book_demo_response_type_1.BookDemoResponse),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [book_student_free_demo_input_1.BookStudentFreeDemoInput]),
    __metadata("design:returntype", Promise)
], DemoResolver.prototype, "bookStudentFreeDemo", null);
__decorate([
    (0, graphql_1.Mutation)(() => activate_demo_response_type_1.ActivateDemoResponse),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [activate_school_demo_input_1.ActivateSchoolDemoInput]),
    __metadata("design:returntype", Promise)
], DemoResolver.prototype, "activateSchoolDemo", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_2.StudentLoginResponse),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [activate_student_demo_input_1.ActivateStudentDemoInput]),
    __metadata("design:returntype", Promise)
], DemoResolver.prototype, "activateStudentDemo", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_1.LoginParentResponse),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [activate_parent_demo_input_1.ActivateParentDemoInput]),
    __metadata("design:returntype", Promise)
], DemoResolver.prototype, "activateParentDemo", null);
__decorate([
    (0, graphql_1.Query)(() => [subscription_plan_entity_1.SubscriptionPlan]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DemoResolver.prototype, "listSubscriptionPlans", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => initiate_payment_response_type_1.InitiatePaymentResponse),
    __param(0, (0, graphql_1.Args)('planId')),
    __param(1, (0, graphql_1.Args)('children', { type: () => [String] })),
    __param(2, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", Promise)
], DemoResolver.prototype, "initiatePayment", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => parent_subscription_entity_1.ParentSubscription, { nullable: true }),
    __param(0, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DemoResolver.prototype, "getMySubscription", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [parent_subscription_entity_1.ParentSubscription]),
    __param(0, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DemoResolver.prototype, "listMySubscriptions", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => student_subscription_entity_1.StudentSubscription, { nullable: true }),
    __param(0, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DemoResolver.prototype, "getMyStudentSubscription", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => [student_subscription_entity_1.StudentSubscription]),
    __param(0, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DemoResolver.prototype, "listMyStudentSubscriptions", null);
exports.DemoResolver = DemoResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [demo_service_1.DemoService])
], DemoResolver);
//# sourceMappingURL=demo.resolver.js.map