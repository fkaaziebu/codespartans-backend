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
exports.OrganizationResolver = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const admin_entity_1 = require("../entities/admin.entity");
const instructor_entity_1 = require("../entities/instructor.entity");
const guards_1 = require("../../../helpers/guards");
const services_1 = require("../services");
const types_1 = require("../types");
let OrganizationResolver = class OrganizationResolver {
    constructor(organizationService) {
        this.organizationService = organizationService;
    }
    async loginOrganization(email, password) {
        return this.organizationService.loginOrganization({ email, password });
    }
    async registerOrganization(name, email, password) {
        return this.organizationService.registerOrganization({
            name,
            email,
            password,
        });
    }
    async registerInstructor(context, name, email, password) {
        const { email: orgEmail } = context.req.user;
        return this.organizationService.registerInstructor({
            organizationEmail: orgEmail,
            name,
            email,
            password,
        });
    }
    async registerAdmin(context, name, email, password) {
        const { email: orgEmail } = context.req.user;
        return this.organizationService.registerAdmin({
            organizationEmail: orgEmail,
            name,
            email,
            password,
        });
    }
};
exports.OrganizationResolver = OrganizationResolver;
__decorate([
    (0, graphql_1.Query)(() => types_1.OrganizationLoginResponse),
    __param(0, (0, graphql_1.Args)('email')),
    __param(1, (0, graphql_1.Args)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrganizationResolver.prototype, "loginOrganization", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_1.RegisterResponse),
    __param(0, (0, graphql_1.Args)('name')),
    __param(1, (0, graphql_1.Args)('email')),
    __param(2, (0, graphql_1.Args)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], OrganizationResolver.prototype, "registerOrganization", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => instructor_entity_1.Instructor),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('name')),
    __param(2, (0, graphql_1.Args)('email')),
    __param(3, (0, graphql_1.Args)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], OrganizationResolver.prototype, "registerInstructor", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => admin_entity_1.Admin),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('name')),
    __param(2, (0, graphql_1.Args)('email')),
    __param(3, (0, graphql_1.Args)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], OrganizationResolver.prototype, "registerAdmin", null);
exports.OrganizationResolver = OrganizationResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [services_1.OrganizationService])
], OrganizationResolver);
//# sourceMappingURL=organization.resolver.js.map