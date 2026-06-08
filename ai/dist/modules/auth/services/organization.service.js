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
exports.OrganizationService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const admin_entity_1 = require("../entities/admin.entity");
const instructor_entity_1 = require("../entities/instructor.entity");
const organization_entity_1 = require("../entities/organization.entity");
const helpers_1 = require("../../../helpers");
const signup_producer_1 = require("./signup.producer");
let OrganizationService = class OrganizationService {
    constructor(organizationRepository, jwtService, signupProducer) {
        this.organizationRepository = organizationRepository;
        this.jwtService = jwtService;
        this.signupProducer = signupProducer;
    }
    async registerOrganization({ name, email, password, }) {
        return await this.organizationRepository.manager.transaction(async (transactionalEntityManager) => {
            const existingOrganization = await transactionalEntityManager.findOne(organization_entity_1.Organization, {
                where: { email },
            });
            if (existingOrganization) {
                throw new Error('Organization with this email already exists');
            }
            const organization = new organization_entity_1.Organization();
            organization.name = name;
            organization.email = email;
            organization.password = await helpers_1.HashHelper.encrypt(password);
            await transactionalEntityManager.save(organization_entity_1.Organization, organization);
            await this.signupProducer.enqueueFreeTrial({ email, role: 'ORGANIZATION' });
            return { message: 'Organization registered successfully' };
        });
    }
    async registerAdmin({ organizationEmail, name, email, password, }) {
        return await this.organizationRepository.manager.transaction(async (transactionalEntityManager) => {
            const organization = await transactionalEntityManager.findOne(organization_entity_1.Organization, {
                where: {
                    email: organizationEmail,
                },
            });
            if (!organization) {
                throw new common_1.NotFoundException('Organization not found');
            }
            const existingAdmin = await transactionalEntityManager.findOne(admin_entity_1.Admin, {
                where: { email },
            });
            if (existingAdmin) {
                throw new Error('Admin with this email already exists');
            }
            const admin = new admin_entity_1.Admin();
            admin.name = name;
            admin.email = email;
            admin.password = await helpers_1.HashHelper.encrypt(password);
            admin.organization = organization;
            return await transactionalEntityManager.save(admin_entity_1.Admin, admin);
        });
    }
    async registerInstructor({ organizationEmail, name, email, password, }) {
        return await this.organizationRepository.manager.transaction(async (transactionalEntityManager) => {
            const organization = await transactionalEntityManager.findOne(organization_entity_1.Organization, {
                where: {
                    email: organizationEmail,
                },
            });
            if (!organization) {
                throw new common_1.NotFoundException('Organization not found');
            }
            const existingInstructor = await transactionalEntityManager.findOne(instructor_entity_1.Instructor, {
                where: { email },
            });
            if (existingInstructor) {
                throw new common_1.BadRequestException('Instructor with this email already exists');
            }
            const instructor = new instructor_entity_1.Instructor();
            instructor.name = name;
            instructor.email = email;
            instructor.password = await helpers_1.HashHelper.encrypt(password);
            instructor.organizations = [organization];
            return await transactionalEntityManager.save(instructor_entity_1.Instructor, instructor);
        });
    }
    async loginOrganization({ email, password, }) {
        return await this.organizationRepository.manager.transaction(async (transactionalEntityManager) => {
            const organization = await transactionalEntityManager.findOne(organization_entity_1.Organization, {
                where: { email },
            });
            if (!organization) {
                throw new common_1.BadRequestException('Email or password is incorrect');
            }
            const isPasswordValid = await helpers_1.HashHelper.compare(password, organization.password);
            if (!isPasswordValid) {
                throw new common_1.BadRequestException('Email or password is incorrect');
            }
            const payload = {
                id: organization.id,
                name: organization.name,
                email: organization.email,
                role: 'ORGANIZATION',
            };
            const access_token = this.jwtService.sign(payload);
            return {
                ...organization,
                token: access_token,
            };
        });
    }
};
exports.OrganizationService = OrganizationService;
exports.OrganizationService = OrganizationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        signup_producer_1.SignupProducer])
], OrganizationService);
//# sourceMappingURL=organization.service.js.map