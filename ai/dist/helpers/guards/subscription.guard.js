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
exports.SubscriptionGuard = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const graphql_2 = require("graphql");
const typeorm_1 = require("@nestjs/typeorm");
const school_demo_entity_1 = require("../../modules/demo/entities/school-demo.entity");
const organization_subscription_entity_1 = require("../../modules/demo/entities/organization-subscription.entity");
const student_subscription_entity_1 = require("../../modules/demo/entities/student-subscription.entity");
const parent_subscription_entity_1 = require("../../modules/parent/entities/parent-subscription.entity");
const organization_entity_1 = require("../../modules/auth/entities/organization.entity");
const student_entity_1 = require("../../modules/auth/entities/student.entity");
const child_entity_1 = require("../../modules/parent/entities/child.entity");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
let SubscriptionGuard = class SubscriptionGuard {
    constructor(studentRepo, orgRepo, orgSubscriptionRepo, studentSubscriptionRepo, childRepo, parentSubscriptionRepo, configService) {
        this.studentRepo = studentRepo;
        this.orgRepo = orgRepo;
        this.orgSubscriptionRepo = orgSubscriptionRepo;
        this.studentSubscriptionRepo = studentSubscriptionRepo;
        this.childRepo = childRepo;
        this.parentSubscriptionRepo = parentSubscriptionRepo;
        this.configService = configService;
    }
    async canActivate(context) {
        const ctx = graphql_1.GqlExecutionContext.create(context);
        const req = ctx.getContext().req;
        const user = req.user;
        if (!user)
            return true;
        const { email, role } = user;
        if (role === 'STUDENT') {
            return this.checkStudentAccess(email, req);
        }
        if (role === 'ORGANIZATION') {
            return this.checkOrgAccess(email);
        }
        if (role === 'CHILD') {
            return this.checkChildAccess(email);
        }
        return true;
    }
    async checkStudentAccess(email, req) {
        const student = await this.studentRepo.findOne({
            where: { email },
            relations: ['organizations', 'organizations.school_demo'],
        });
        if (!student)
            return true;
        const genpopEmail = this.configService.get('GENPOP_EMAIL');
        const nonGenpopOrgs = (student.organizations ?? []).filter((org) => org.email !== genpopEmail);
        for (const org of nonGenpopOrgs) {
            if (await this.orgHasValidAccess(org))
                return true;
        }
        return this.checkStudentSubscription(email, req);
    }
    async checkStudentSubscription(email, req) {
        const now = new Date();
        const activeSub = await this.studentSubscriptionRepo.findOne({
            where: {
                student: { email },
                status: organization_subscription_entity_1.SubscriptionStatus.ACTIVE,
            },
            relations: ['plan'],
            order: { expires_at: 'DESC' },
        });
        if (activeSub && activeSub.expires_at > now) {
            if (activeSub.plan?.plan_key === 'student_free') {
                req.isStudentFreeTrial = true;
            }
            return true;
        }
        throw new graphql_2.GraphQLError('You need an active subscription. Please subscribe to a plan to continue.', { extensions: { code: 'SUBSCRIPTION_REQUIRED' } });
    }
    async checkOrgAccess(email) {
        const org = await this.orgRepo.findOne({
            where: { email },
            relations: ['school_demo'],
        });
        if (!org)
            throw new common_1.ForbiddenException('Organization not found');
        if (await this.orgHasValidAccess(org))
            return true;
        throw new graphql_2.GraphQLError('Your free trial has ended. Please subscribe to a plan to continue.', { extensions: { code: 'SUBSCRIPTION_REQUIRED' } });
    }
    async checkChildAccess(studentEmail) {
        const child = await this.childRepo.findOne({
            where: { student: { email: studentEmail } },
            relations: ['parent'],
        });
        if (!child?.parent) {
            throw new graphql_2.GraphQLError('Your parent needs an active subscription to unlock tests.', { extensions: { code: 'SUBSCRIPTION_REQUIRED' } });
        }
        const now = new Date();
        const childSpecificSub = await this.parentSubscriptionRepo
            .createQueryBuilder('sub')
            .innerJoin('sub.children', 'child')
            .where('sub.parent.id = :parentId', { parentId: child.parent.id })
            .andWhere('child.id = :childId', { childId: child.id })
            .andWhere('sub.status = :status', { status: organization_subscription_entity_1.SubscriptionStatus.ACTIVE })
            .andWhere('sub.expires_at > :now', { now })
            .getOne();
        if (childSpecificSub)
            return true;
        const legacySub = await this.parentSubscriptionRepo
            .createQueryBuilder('sub')
            .leftJoin('sub.children', 'child')
            .where('sub.parent.id = :parentId', { parentId: child.parent.id })
            .andWhere('sub.status = :status', { status: organization_subscription_entity_1.SubscriptionStatus.ACTIVE })
            .andWhere('sub.expires_at > :now', { now })
            .groupBy('sub.id')
            .having('COUNT(child.id) = 0')
            .getOne();
        if (legacySub)
            return true;
        throw new graphql_2.GraphQLError('Your parent needs an active subscription to unlock tests.', { extensions: { code: 'SUBSCRIPTION_REQUIRED' } });
    }
    async orgHasValidAccess(org) {
        const now = new Date();
        if (org.school_demo &&
            org.school_demo.status === school_demo_entity_1.DemoStatus.ACTIVE &&
            org.school_demo.expires_at > now) {
            return true;
        }
        const activeSub = await this.orgSubscriptionRepo.findOne({
            where: {
                organization: { id: org.id },
                status: organization_subscription_entity_1.SubscriptionStatus.ACTIVE,
            },
            order: { expires_at: 'DESC' },
        });
        if (activeSub && activeSub.expires_at > now)
            return true;
        return false;
    }
};
exports.SubscriptionGuard = SubscriptionGuard;
exports.SubscriptionGuard = SubscriptionGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(1, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(2, (0, typeorm_1.InjectRepository)(organization_subscription_entity_1.OrgSubscription)),
    __param(3, (0, typeorm_1.InjectRepository)(student_subscription_entity_1.StudentSubscription)),
    __param(4, (0, typeorm_1.InjectRepository)(child_entity_1.Child)),
    __param(5, (0, typeorm_1.InjectRepository)(parent_subscription_entity_1.ParentSubscription)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], SubscriptionGuard);
//# sourceMappingURL=subscription.guard.js.map