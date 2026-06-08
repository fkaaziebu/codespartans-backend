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
var DemoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const crypto_1 = require("crypto");
const helpers_1 = require("../../../helpers");
const organization_entity_1 = require("../../auth/entities/organization.entity");
const student_entity_1 = require("../../auth/entities/student.entity");
const cart_entity_1 = require("../../inventory/entities/cart.entity");
const parent_entity_1 = require("../../parent/entities/parent.entity");
const email_producer_1 = require("../../auth/services/email.producer");
const typeorm_2 = require("typeorm");
const school_demo_entity_1 = require("../entities/school-demo.entity");
const parent_demo_request_entity_1 = require("../entities/parent-demo-request.entity");
const student_demo_request_entity_1 = require("../entities/student-demo-request.entity");
const subscription_plan_entity_1 = require("../entities/subscription-plan.entity");
const organization_subscription_entity_1 = require("../entities/organization-subscription.entity");
const parent_subscription_entity_1 = require("../../parent/entities/parent-subscription.entity");
const student_subscription_entity_1 = require("../entities/student-subscription.entity");
const payment_service_1 = require("./payment.service");
let DemoService = DemoService_1 = class DemoService {
    constructor(schoolDemoRepository, parentDemoRepository, studentDemoRepository, orgRepository, cartRepository, studentRepository, parentRepository, orgSubscriptionRepository, parentSubscriptionRepository, studentSubscriptionRepository, planRepository, emailProducer, paymentService, configService, jwtService) {
        this.schoolDemoRepository = schoolDemoRepository;
        this.parentDemoRepository = parentDemoRepository;
        this.studentDemoRepository = studentDemoRepository;
        this.orgRepository = orgRepository;
        this.cartRepository = cartRepository;
        this.studentRepository = studentRepository;
        this.parentRepository = parentRepository;
        this.orgSubscriptionRepository = orgSubscriptionRepository;
        this.parentSubscriptionRepository = parentSubscriptionRepository;
        this.studentSubscriptionRepository = studentSubscriptionRepository;
        this.planRepository = planRepository;
        this.emailProducer = emailProducer;
        this.paymentService = paymentService;
        this.configService = configService;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(DemoService_1.name);
    }
    async bookSchoolFreeDemo(input) {
        const existing = await this.schoolDemoRepository.findOne({
            where: { email: input.email },
        });
        if (existing) {
            throw new common_1.ConflictException('A demo has already been requested for this email address.');
        }
        const demo_code = (0, crypto_1.randomUUID)();
        const demo = this.schoolDemoRepository.create({ ...input, demo_code });
        await this.schoolDemoRepository.save(demo);
        await this.emailProducer.sendDemoInvitationEmail({
            email: input.email,
            name: input.name,
            school_name: input.school_name,
        });
        await this.emailProducer.sendDemoAdminNotificationEmail({
            name: input.name,
            school_name: input.school_name,
            role: input.role,
            approximate_students: input.approximate_students,
            email: input.email,
            whatsapp_number: input.whatsapp_number,
        });
        return {
            message: 'Your free demo has been booked! Check your email for the registration link.',
        };
    }
    async bookParentFreeDemo(input) {
        const existing = await this.parentDemoRepository.findOne({
            where: { email: input.email },
        });
        if (existing) {
            throw new common_1.ConflictException('A demo has already been requested for this email address.');
        }
        const demo_code = (0, crypto_1.randomUUID)();
        const record = this.parentDemoRepository.create({ ...input, demo_code });
        await this.parentDemoRepository.save(record);
        const registrationUrl = this.configService.get('PARENT_DEMO_URL', 'http://localhost:3000') + `/demo/register?demoCode=${demo_code}`;
        const target_exams_display = input.target_exams.join(', ');
        await this.emailProducer.sendParentDemoInvitationEmail({
            email: input.email,
            full_name: input.full_name,
            target_exams: input.target_exams,
            registrationUrl,
        });
        await this.emailProducer.sendLeadAdminNotificationEmail({
            lead_type: 'Parent',
            full_name: input.full_name,
            email: input.email,
            target_exams_display,
            registrationUrl,
        });
        return {
            message: 'Your free demo has been booked! Check your email to get started.',
        };
    }
    async bookStudentFreeDemo(input) {
        const existing = await this.studentDemoRepository.findOne({
            where: { email: input.email },
        });
        if (existing) {
            throw new common_1.ConflictException('A demo has already been requested for this email address.');
        }
        const demo_code = (0, crypto_1.randomUUID)();
        const record = this.studentDemoRepository.create({ ...input, demo_code });
        await this.studentDemoRepository.save(record);
        const registrationUrl = this.configService.get('STUDENT_DEMO_URL', 'http://localhost:3000') + `/demo/register?demoCode=${demo_code}`;
        await this.emailProducer.sendStudentDemoInvitationEmail({
            email: input.email,
            full_name: input.full_name,
            target_exam: input.target_exam,
            registrationUrl,
        });
        await this.emailProducer.sendLeadAdminNotificationEmail({
            lead_type: 'Student',
            full_name: input.full_name,
            email: input.email,
            target_exams_display: input.target_exam,
            registrationUrl,
        });
        return {
            message: 'Your free demo has been booked! Check your email to get started.',
        };
    }
    async activateSchoolDemo(input) {
        const demo = await this.schoolDemoRepository.findOne({
            where: { demo_code: input.demo_code },
        });
        if (!demo) {
            throw new common_1.NotFoundException('Invalid demo code.');
        }
        if (demo.status !== school_demo_entity_1.DemoStatus.PENDING) {
            throw new common_1.BadRequestException('This demo code has already been used or has expired.');
        }
        const existingOrg = await this.orgRepository.findOne({
            where: { email: demo.email },
        });
        if (existingOrg) {
            throw new common_1.ConflictException('An account already exists for this email address.');
        }
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + demo.trial_duration_days);
        const org = this.orgRepository.create({
            name: demo.school_name,
            email: demo.email,
            password: await helpers_1.HashHelper.encrypt(input.password),
            school_demo: demo,
        });
        demo.status = school_demo_entity_1.DemoStatus.ACTIVE;
        demo.activated_at = now;
        demo.expires_at = expiresAt;
        const trialPlan = await this.planRepository.findOne({
            where: { plan_key: 'school_trial' },
        });
        await this.orgRepository.manager.transaction(async (em) => {
            await em.save(school_demo_entity_1.SchoolDemo, demo);
            await em.save(organization_entity_1.Organization, org);
            if (trialPlan) {
                await em.save(organization_subscription_entity_1.OrgSubscription, em.create(organization_subscription_entity_1.OrgSubscription, {
                    organization: org,
                    plan: trialPlan,
                    status: organization_subscription_entity_1.SubscriptionStatus.ACTIVE,
                    started_at: now,
                    expires_at: expiresAt,
                }));
            }
        });
        const payload = {
            id: org.id,
            name: org.name,
            email: org.email,
            role: 'ORGANIZATION',
        };
        const access_token = this.jwtService.sign(payload);
        return {
            access_token,
            org_name: org.name,
            email: org.email,
            expires_at: expiresAt.toISOString(),
        };
    }
    async activateStudentDemo(input) {
        const demo = await this.studentDemoRepository.findOne({
            where: { demo_code: input.demo_code },
        });
        if (!demo) {
            throw new common_1.NotFoundException('Invalid demo code.');
        }
        if (demo.status !== school_demo_entity_1.DemoStatus.PENDING) {
            throw new common_1.BadRequestException('This demo code has already been used or has expired.');
        }
        const existingStudent = await this.studentRepository.findOne({
            where: { email: demo.email },
        });
        if (existingStudent) {
            throw new common_1.ConflictException('An account already exists for this email address.');
        }
        const organization = await this.orgRepository.findOne({
            where: { email: this.configService.get('GENPOP_EMAIL') },
        });
        if (!organization) {
            throw new common_1.NotFoundException('Genpop organization not found.');
        }
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + demo.trial_duration_days);
        const cart = this.cartRepository.create();
        const student = this.studentRepository.create({
            name: demo.full_name,
            email: demo.email,
            password: await helpers_1.HashHelper.encrypt(input.password),
            is_account_validated: true,
            organizations: [organization],
        });
        demo.status = school_demo_entity_1.DemoStatus.ACTIVE;
        demo.activated_at = now;
        demo.expires_at = expiresAt;
        const studentTrialPlan = await this.planRepository.findOne({
            where: { plan_key: 'student_free' },
        });
        await this.studentRepository.manager.transaction(async (em) => {
            await em.save(cart_entity_1.Cart, cart);
            student.cart = cart;
            await em.save(student_demo_request_entity_1.StudentDemoRequest, demo);
            await em.save(student_entity_1.Student, student);
            if (studentTrialPlan) {
                await em.save(student_subscription_entity_1.StudentSubscription, em.create(student_subscription_entity_1.StudentSubscription, {
                    student,
                    plan: studentTrialPlan,
                    status: organization_subscription_entity_1.SubscriptionStatus.ACTIVE,
                    started_at: now,
                    expires_at: expiresAt,
                }));
            }
        });
        const payload = {
            id: student.id,
            name: student.name,
            email: student.email,
            role: 'STUDENT',
        };
        const access_token = this.jwtService.sign(payload);
        const refresh_token = this.jwtService.sign({ ...payload, type: 'refresh' }, { expiresIn: '30d' });
        return {
            ...student,
            token: access_token,
            refresh_token,
            expires_at: expiresAt.toISOString(),
        };
    }
    async activateParentDemo(input) {
        const demo = await this.parentDemoRepository.findOne({
            where: { demo_code: input.demo_code },
        });
        if (!demo) {
            throw new common_1.NotFoundException('Invalid demo code.');
        }
        if (demo.status !== school_demo_entity_1.DemoStatus.PENDING) {
            throw new common_1.BadRequestException('This demo code has already been used or has expired.');
        }
        const existingParent = await this.parentRepository.findOne({
            where: { email: demo.email },
        });
        if (existingParent) {
            throw new common_1.ConflictException('An account already exists for this email address.');
        }
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + demo.trial_duration_days);
        const [first_name, ...rest] = demo.full_name.trim().split(' ');
        const last_name = rest.join(' ') || first_name;
        const parent = this.parentRepository.create({
            first_name,
            last_name,
            email: demo.email,
            password: await helpers_1.HashHelper.encrypt(input.password),
            is_account_validated: true,
            is_setup_completed: false,
        });
        demo.status = school_demo_entity_1.DemoStatus.ACTIVE;
        demo.activated_at = now;
        demo.expires_at = expiresAt;
        const parentTrialPlan = await this.planRepository.findOne({
            where: { plan_key: 'parent_trial' },
        });
        await this.parentRepository.manager.transaction(async (em) => {
            await em.save(parent_demo_request_entity_1.ParentDemoRequest, demo);
            await em.save(parent_entity_1.Parent, parent);
            if (parentTrialPlan) {
                await em.save(parent_subscription_entity_1.ParentSubscription, em.create(parent_subscription_entity_1.ParentSubscription, {
                    parent,
                    plan: parentTrialPlan,
                    status: organization_subscription_entity_1.SubscriptionStatus.ACTIVE,
                    started_at: now,
                    expires_at: expiresAt,
                }));
            }
        });
        const payload = {
            id: parent.id,
            name: `${parent.first_name} ${parent.last_name}`,
            email: parent.email,
            role: 'PARENT',
        };
        const token = this.jwtService.sign(payload);
        const refresh_token = this.jwtService.sign({ ...payload, type: 'refresh' }, { expiresIn: '30d' });
        return {
            ...parent,
            token,
            refresh_token,
            expires_at: expiresAt.toISOString(),
        };
    }
    async listPlans() {
        return this.paymentService.listPlans();
    }
    async initiatePayment(email, planId, role, childrenIds = []) {
        return this.paymentService.initiatePayment(email, planId, role, childrenIds);
    }
    async getMySubscription(parentEmail) {
        return this.paymentService.getParentSubscription(parentEmail);
    }
    async listMySubscriptions(parentEmail) {
        return this.paymentService.listParentSubscriptions(parentEmail);
    }
    async getMyStudentSubscription(studentEmail) {
        return this.paymentService.getStudentSubscription(studentEmail);
    }
    async listMyStudentSubscriptions(studentEmail) {
        return this.paymentService.listStudentSubscriptions(studentEmail);
    }
};
exports.DemoService = DemoService;
exports.DemoService = DemoService = DemoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(school_demo_entity_1.SchoolDemo)),
    __param(1, (0, typeorm_1.InjectRepository)(parent_demo_request_entity_1.ParentDemoRequest)),
    __param(2, (0, typeorm_1.InjectRepository)(student_demo_request_entity_1.StudentDemoRequest)),
    __param(3, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(4, (0, typeorm_1.InjectRepository)(cart_entity_1.Cart)),
    __param(5, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(6, (0, typeorm_1.InjectRepository)(parent_entity_1.Parent)),
    __param(7, (0, typeorm_1.InjectRepository)(organization_subscription_entity_1.OrgSubscription)),
    __param(8, (0, typeorm_1.InjectRepository)(parent_subscription_entity_1.ParentSubscription)),
    __param(9, (0, typeorm_1.InjectRepository)(student_subscription_entity_1.StudentSubscription)),
    __param(10, (0, typeorm_1.InjectRepository)(subscription_plan_entity_1.SubscriptionPlan)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        email_producer_1.EmailProducer,
        payment_service_1.PaymentService,
        config_1.ConfigService,
        jwt_1.JwtService])
], DemoService);
//# sourceMappingURL=demo.service.js.map