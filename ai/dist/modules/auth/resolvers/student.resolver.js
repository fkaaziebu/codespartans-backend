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
exports.StudentResolver = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const student_entity_1 = require("../entities/student.entity");
const guards_1 = require("../../../helpers/guards");
const inputs_1 = require("../../../helpers/inputs");
const student_service_1 = require("../services/student.service");
const types_1 = require("../types");
let StudentResolver = class StudentResolver {
    constructor(studentService) {
        this.studentService = studentService;
    }
    async loginStudent(email, password) {
        return this.studentService.loginStudent({
            email,
            password,
        });
    }
    async studentProfile(context) {
        const { email } = context.req.user;
        return this.studentService.studentProfile({ email });
    }
    async listOrganizations(searchTerm, pagination) {
        return this.studentService.listOrganizationsPaginated({
            searchTerm,
            pagination,
        });
    }
    async registerStudent(name, email, password) {
        return this.studentService.registerStudent({
            name,
            email,
            password,
        });
    }
    async refreshStudentToken(refresh_token) {
        return this.studentService.refreshStudentToken({ refresh_token });
    }
    async completeStudentAccountValidation(email, validation_code) {
        return this.studentService.completeStudentAccountValidation({
            email,
            validation_code,
        });
    }
    async resendAccountValidationCode(email) {
        return this.studentService.resendAccountValidationCode({ email });
    }
    async requestStudentPasswordReset(email) {
        return this.studentService.requestStudentPasswordReset({
            email,
        });
    }
    async resetStudentPassword(email, token, password) {
        return this.studentService.resetStudentPassword({
            email,
            token,
            password,
        });
    }
};
exports.StudentResolver = StudentResolver;
__decorate([
    (0, graphql_1.Query)(() => types_1.StudentLoginResponse),
    __param(0, (0, graphql_1.Args)('email')),
    __param(1, (0, graphql_1.Args)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StudentResolver.prototype, "loginStudent", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => student_entity_1.Student),
    __param(0, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentResolver.prototype, "studentProfile", null);
__decorate([
    (0, graphql_1.Query)(() => types_1.OrganizationConnection),
    __param(0, (0, graphql_1.Args)('searchTerm', { nullable: true })),
    __param(1, (0, graphql_1.Args)('pagination', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inputs_1.PaginationInput]),
    __metadata("design:returntype", Promise)
], StudentResolver.prototype, "listOrganizations", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_1.RegisterResponse),
    __param(0, (0, graphql_1.Args)('name')),
    __param(1, (0, graphql_1.Args)('email')),
    __param(2, (0, graphql_1.Args)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], StudentResolver.prototype, "registerStudent", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_1.RefreshTokenResponse),
    __param(0, (0, graphql_1.Args)('refresh_token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StudentResolver.prototype, "refreshStudentToken", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_1.PasswordResetResponse),
    __param(0, (0, graphql_1.Args)('email')),
    __param(1, (0, graphql_1.Args)('validation_code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StudentResolver.prototype, "completeStudentAccountValidation", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_1.PasswordResetResponse),
    __param(0, (0, graphql_1.Args)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StudentResolver.prototype, "resendAccountValidationCode", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_1.PasswordResetResponse),
    __param(0, (0, graphql_1.Args)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StudentResolver.prototype, "requestStudentPasswordReset", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_1.PasswordResetResponse),
    __param(0, (0, graphql_1.Args)('email')),
    __param(1, (0, graphql_1.Args)('token')),
    __param(2, (0, graphql_1.Args)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], StudentResolver.prototype, "resetStudentPassword", null);
exports.StudentResolver = StudentResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [student_service_1.StudentService])
], StudentResolver);
//# sourceMappingURL=student.resolver.js.map