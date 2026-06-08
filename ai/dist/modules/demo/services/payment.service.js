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
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const axios_1 = require("axios");
const crypto = require("crypto");
const organization_entity_1 = require("../../auth/entities/organization.entity");
const student_entity_1 = require("../../auth/entities/student.entity");
const child_entity_1 = require("../../parent/entities/child.entity");
const parent_entity_1 = require("../../parent/entities/parent.entity");
const parent_subscription_entity_1 = require("../../parent/entities/parent-subscription.entity");
const typeorm_2 = require("typeorm");
const organization_subscription_entity_1 = require("../entities/organization-subscription.entity");
const student_subscription_entity_1 = require("../entities/student-subscription.entity");
const subscription_plan_entity_1 = require("../entities/subscription-plan.entity");
let PaymentService = class PaymentService {
    constructor(planRepo, orgSubscriptionRepo, parentSubscriptionRepo, studentSubscriptionRepo, childRepo, orgRepo, parentRepo, studentRepo, configService) {
        this.planRepo = planRepo;
        this.orgSubscriptionRepo = orgSubscriptionRepo;
        this.parentSubscriptionRepo = parentSubscriptionRepo;
        this.studentSubscriptionRepo = studentSubscriptionRepo;
        this.childRepo = childRepo;
        this.orgRepo = orgRepo;
        this.parentRepo = parentRepo;
        this.studentRepo = studentRepo;
        this.configService = configService;
        this.paystackBaseUrl = 'https://api.paystack.co';
    }
    async listPlans() {
        return this.planRepo.find({ where: { is_active: true } });
    }
    async initiatePayment(email, planId, role, childrenIds = []) {
        const plan = await this.planRepo.findOne({
            where: { id: planId, is_active: true },
        });
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        const now = new Date();
        if (role === 'PARENT') {
            const parent = await this.parentRepo.findOne({ where: { email } });
            if (parent && childrenIds.length > 0) {
                const ownedChildren = await this.childRepo.find({
                    where: { parent: { id: parent.id } },
                    select: ['id', 'full_name'],
                });
                const ownedIds = new Set(ownedChildren.map((c) => c.id));
                const childNameById = new Map(ownedChildren.map((c) => [c.id, c.full_name]));
                const invalidIds = childrenIds.filter((id) => !ownedIds.has(id));
                if (invalidIds.length > 0) {
                    throw new common_1.BadRequestException(`Children not found or not belonging to parent: ${invalidIds.join(', ')}`);
                }
                for (const childId of childrenIds) {
                    const activeSub = await this.parentSubscriptionRepo
                        .createQueryBuilder('sub')
                        .innerJoinAndSelect('sub.plan', 'plan')
                        .innerJoin('sub.children', 'child')
                        .where('child.id = :childId', { childId })
                        .andWhere('sub.status = :status', {
                        status: organization_subscription_entity_1.SubscriptionStatus.ACTIVE,
                    })
                        .andWhere('sub.expires_at > :now', { now })
                        .getOne();
                    if (activeSub) {
                        if (activeSub.plan.price === 0) {
                            activeSub.status = organization_subscription_entity_1.SubscriptionStatus.EXPIRED;
                            await this.parentSubscriptionRepo.save(activeSub);
                            continue;
                        }
                        const childName = childNameById.get(childId) ?? childId;
                        throw new common_1.BadRequestException(`${childName} already has an active subscription`);
                    }
                }
            }
        }
        else if (role === 'STUDENT') {
            const student = await this.studentRepo.findOne({ where: { email } });
            if (student) {
                const existingSub = await this.studentSubscriptionRepo.findOne({
                    where: {
                        student: { id: student.id },
                        status: organization_subscription_entity_1.SubscriptionStatus.ACTIVE,
                    },
                    relations: ['plan'],
                    order: { expires_at: 'DESC' },
                });
                if (existingSub && existingSub.expires_at > now) {
                    if (existingSub.plan.price > 0) {
                        throw new common_1.BadRequestException('You already have an active subscription plan');
                    }
                    existingSub.status = organization_subscription_entity_1.SubscriptionStatus.EXPIRED;
                    await this.studentSubscriptionRepo.save(existingSub);
                }
                else if (existingSub) {
                    existingSub.status = organization_subscription_entity_1.SubscriptionStatus.EXPIRED;
                    await this.studentSubscriptionRepo.save(existingSub);
                }
            }
        }
        else {
            const org = await this.orgRepo.findOne({ where: { email } });
            if (org) {
                const existingSub = await this.orgSubscriptionRepo.findOne({
                    where: {
                        organization: { id: org.id },
                        status: organization_subscription_entity_1.SubscriptionStatus.ACTIVE,
                    },
                    relations: ['plan'],
                    order: { expires_at: 'DESC' },
                });
                if (existingSub && existingSub.expires_at > now) {
                    if (existingSub.plan.price > 0) {
                        throw new common_1.BadRequestException('You already have an active subscription plan');
                    }
                    existingSub.status = organization_subscription_entity_1.SubscriptionStatus.EXPIRED;
                    await this.orgSubscriptionRepo.save(existingSub);
                }
                else if (existingSub) {
                    existingSub.status = organization_subscription_entity_1.SubscriptionStatus.EXPIRED;
                    await this.orgSubscriptionRepo.save(existingSub);
                }
            }
        }
        if (plan.price === 0) {
            return this.activateFreeTrial(email, plan, role, childrenIds);
        }
        const secretKey = this.configService.get('PAYSTACK_SECRET_KEY');
        const count = role === 'PARENT' && childrenIds.length > 0 ? childrenIds.length : 1;
        const discount = plan.plan_key.startsWith('parent_') ? 0.8 : 1.0;
        const amountInKobo = Math.round(plan.price * discount * count * 100);
        let payerEmail;
        let metadata;
        let callbackUrl;
        if (role === 'PARENT') {
            const parent = await this.parentRepo.findOne({ where: { email } });
            if (!parent)
                throw new common_1.NotFoundException('Parent not found');
            payerEmail = parent.email;
            metadata = {
                parent_id: parent.id,
                plan_id: plan.id,
                plan_name: plan.name,
                children_ids: childrenIds.join(','),
            };
            const parentUrl = this.configService.get('PARENT_UI_URL', 'http://localhost:3000');
            callbackUrl = parentUrl + '/billing/callback';
        }
        else if (role === 'STUDENT') {
            const student = await this.studentRepo.findOne({ where: { email } });
            if (!student)
                throw new common_1.NotFoundException('Student not found');
            payerEmail = student.email;
            metadata = {
                student_id: student.id,
                plan_id: plan.id,
                plan_name: plan.name,
            };
            const studentUrl = this.configService.get('STUDENT_DEMO_URL', 'http://localhost:3000');
            callbackUrl = studentUrl + '/billing/callback';
        }
        else {
            const org = await this.orgRepo.findOne({ where: { email } });
            if (!org)
                throw new common_1.NotFoundException('Organization not found');
            payerEmail = org.email;
            metadata = { org_id: org.id, plan_id: plan.id, plan_name: plan.name };
            const schoolUrl = this.configService.get('SCHOOL_DEMO_URL', 'http://localhost:3000');
            callbackUrl = schoolUrl + '/payment/callback';
        }
        const response = await axios_1.default.post(`${this.paystackBaseUrl}/transaction/initialize`, {
            email: payerEmail,
            amount: amountInKobo,
            currency: plan.currency,
            metadata,
            callback_url: callbackUrl,
        }, {
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
            },
        });
        const { authorization_url, reference } = response.data.data;
        return { authorization_url, reference };
    }
    async activateFreeTrial(email, plan, role, childrenIds) {
        const reference = `free_trial_${crypto.randomUUID()}`;
        const startedAt = new Date();
        const expiresAt = new Date(startedAt);
        expiresAt.setDate(expiresAt.getDate() + 7);
        let callbackUrl;
        if (role === 'PARENT') {
            const parent = await this.parentRepo.findOne({ where: { email } });
            if (!parent)
                throw new common_1.NotFoundException('Parent not found');
            let coveredChildren = [];
            if (childrenIds.length > 0) {
                coveredChildren = await this.childRepo.find({
                    where: { id: (0, typeorm_2.In)(childrenIds) },
                });
            }
            await this.parentSubscriptionRepo.save(this.parentSubscriptionRepo.create({
                parent,
                plan,
                paystack_reference: reference,
                status: organization_subscription_entity_1.SubscriptionStatus.ACTIVE,
                started_at: startedAt,
                expires_at: expiresAt,
                children: coveredChildren,
            }));
            const parentUrl = this.configService.get('PARENT_UI_URL', 'http://localhost:3000');
            callbackUrl = `${parentUrl}/billing/callback?reference=${reference}&status=success`;
        }
        else if (role === 'STUDENT') {
            const student = await this.studentRepo.findOne({ where: { email } });
            if (!student)
                throw new common_1.NotFoundException('Student not found');
            await this.studentSubscriptionRepo.save(this.studentSubscriptionRepo.create({
                student,
                plan,
                paystack_reference: reference,
                status: organization_subscription_entity_1.SubscriptionStatus.ACTIVE,
                started_at: startedAt,
                expires_at: expiresAt,
            }));
            const studentUrl = this.configService.get('STUDENT_DEMO_URL', 'http://localhost:3000');
            callbackUrl = `${studentUrl}/billing/callback?reference=${reference}&status=success`;
        }
        else {
            const org = await this.orgRepo.findOne({ where: { email } });
            if (!org)
                throw new common_1.NotFoundException('Organization not found');
            await this.orgSubscriptionRepo.save(this.orgSubscriptionRepo.create({
                organization: org,
                plan,
                paystack_reference: reference,
                status: organization_subscription_entity_1.SubscriptionStatus.ACTIVE,
                started_at: startedAt,
                expires_at: expiresAt,
            }));
            const schoolUrl = this.configService.get('SCHOOL_DEMO_URL', 'http://localhost:3000');
            callbackUrl = `${schoolUrl}/payment/callback?reference=${reference}&status=success`;
        }
        return { authorization_url: callbackUrl, reference };
    }
    verifyWebhookSignature(signature, rawBody) {
        const secretKey = this.configService.get('PAYSTACK_SECRET_KEY');
        const hash = crypto
            .createHmac('sha512', secretKey)
            .update(rawBody)
            .digest('hex');
        if (hash !== signature) {
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
    }
    async handleWebhookEvent(event, data) {
        if (event !== 'charge.success')
            return;
        const { reference, metadata, status } = data;
        if (status !== 'success')
            return;
        const { org_id, parent_id, student_id, plan_id, children_ids } = metadata ?? {};
        if (!plan_id || (!org_id && !parent_id && !student_id))
            return;
        const plan = await this.planRepo.findOne({ where: { id: plan_id } });
        if (!plan)
            return;
        const startedAt = new Date();
        const expiresAt = new Date(startedAt);
        expiresAt.setDate(expiresAt.getDate() + Number(plan.duration_days));
        if (student_id) {
            const student = await this.studentRepo.findOne({
                where: { id: student_id },
            });
            if (!student)
                return;
            const existing = await this.studentSubscriptionRepo.findOne({
                where: { paystack_reference: reference },
            });
            if (existing)
                return;
            await this.studentSubscriptionRepo.save(this.studentSubscriptionRepo.create({
                student,
                plan,
                paystack_reference: reference,
                status: organization_subscription_entity_1.SubscriptionStatus.ACTIVE,
                started_at: startedAt,
                expires_at: expiresAt,
            }));
        }
        else if (parent_id) {
            const parent = await this.parentRepo.findOne({
                where: { id: parent_id },
            });
            if (!parent)
                return;
            const existing = await this.parentSubscriptionRepo.findOne({
                where: { paystack_reference: reference },
            });
            if (existing)
                return;
            let coveredChildren = [];
            if (children_ids) {
                const ids = children_ids.split(',').filter(Boolean);
                if (ids.length > 0) {
                    coveredChildren = await this.childRepo.find({
                        where: { id: (0, typeorm_2.In)(ids) },
                    });
                }
            }
            await this.parentSubscriptionRepo.save(this.parentSubscriptionRepo.create({
                parent,
                plan,
                paystack_reference: reference,
                status: organization_subscription_entity_1.SubscriptionStatus.ACTIVE,
                started_at: startedAt,
                expires_at: expiresAt,
                children: coveredChildren,
            }));
        }
        else {
            const org = await this.orgRepo.findOne({ where: { id: org_id } });
            if (!org)
                return;
            const existing = await this.orgSubscriptionRepo.findOne({
                where: { paystack_reference: reference },
            });
            if (existing)
                return;
            await this.orgSubscriptionRepo.save(this.orgSubscriptionRepo.create({
                organization: org,
                plan,
                paystack_reference: reference,
                status: organization_subscription_entity_1.SubscriptionStatus.ACTIVE,
                started_at: startedAt,
                expires_at: expiresAt,
            }));
        }
    }
    async getParentSubscription(parentEmail) {
        return this.parentSubscriptionRepo.findOne({
            where: {
                parent: { email: parentEmail },
                status: organization_subscription_entity_1.SubscriptionStatus.ACTIVE,
            },
            relations: ['plan', 'children'],
            order: { expires_at: 'DESC' },
        });
    }
    async listParentSubscriptions(parentEmail) {
        const year = new Date().getFullYear();
        const start = new Date(year, 0, 1);
        const end = new Date(year + 1, 0, 1);
        return this.parentSubscriptionRepo.find({
            where: {
                parent: { email: parentEmail },
                created_at: (0, typeorm_2.Between)(start, end),
            },
            relations: ['plan', 'children'],
            order: { created_at: 'DESC' },
        });
    }
    async getStudentSubscription(studentEmail) {
        return this.studentSubscriptionRepo.findOne({
            where: {
                student: { email: studentEmail },
                status: organization_subscription_entity_1.SubscriptionStatus.ACTIVE,
            },
            relations: ['plan'],
            order: { expires_at: 'DESC' },
        });
    }
    async listStudentSubscriptions(studentEmail) {
        const year = new Date().getFullYear();
        const start = new Date(year, 0, 1);
        const end = new Date(year + 1, 0, 1);
        return this.studentSubscriptionRepo.find({
            where: {
                student: { email: studentEmail },
                created_at: (0, typeorm_2.Between)(start, end),
            },
            relations: ['plan'],
            order: { created_at: 'DESC' },
        });
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subscription_plan_entity_1.SubscriptionPlan)),
    __param(1, (0, typeorm_1.InjectRepository)(organization_subscription_entity_1.OrgSubscription)),
    __param(2, (0, typeorm_1.InjectRepository)(parent_subscription_entity_1.ParentSubscription)),
    __param(3, (0, typeorm_1.InjectRepository)(student_subscription_entity_1.StudentSubscription)),
    __param(4, (0, typeorm_1.InjectRepository)(child_entity_1.Child)),
    __param(5, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(6, (0, typeorm_1.InjectRepository)(parent_entity_1.Parent)),
    __param(7, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map