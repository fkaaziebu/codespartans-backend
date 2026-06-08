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
exports.StudentController = void 0;
const common_1 = require("@nestjs/common");
const student_service_1 = require("../services/student.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const google_auth_guard_1 = require("../guards/google-auth.guard");
const consent_query_dto_1 = require("../dto/consent-query.dto");
const consent_info_body_dto_1 = require("../dto/consent-info-body.dto");
let StudentController = class StudentController {
    constructor(studentService, jwtService, configService) {
        this.studentService = studentService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    googleLogin() { }
    async googleCallback(req, res) {
        if (req.user.needsConsent) {
            return res.redirect(`/v1/students/auth/consent?email=${req.user.consentData.email}&firstName=${req.user.consentData.firstName}&lastName=${req.user.consentData.lastName}`);
        }
        const { user } = req;
        if (!user.is_account_validated) {
            return res.redirect(`${this.configService.get('STUDENT_URL')}/validate-account?email=${user.email}`);
        }
        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'STUDENT',
        };
        const access_token = this.jwtService.sign(payload);
        res.redirect(`${this.configService.get('STUDENT_URL')}/oauth/redirect?token=${access_token}&organizationId=${user.organizations.at(0).id}&isSetupCompleted=${Boolean(user.is_setup_completed)}`);
    }
    async showConsentPage(consentQueryDto, res) {
        return res.redirect(`${this.configService.get('STUDENT_URL')}/oauth/consent?email=${consentQueryDto.email}&firstName=${consentQueryDto.firstName}&lastName=${consentQueryDto.lastName}`);
    }
    async handleConsent(consentInfo) {
        const { consent, ...consentData } = consentInfo;
        if (consent === 'yes') {
            const payload = await this.studentService.createGoogleUser(consentData);
            return {
                redirectUrl: `${this.configService.get('STUDENT_URL')}/validate-account?email=${payload.email}`,
            };
        }
        return {
            redirectUrl: `${this.configService.get('STUDENT_URL')}/oauth/failed`,
        };
    }
};
exports.StudentController = StudentController;
__decorate([
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    (0, common_1.Get)('/auth/google/login'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StudentController.prototype, "googleLogin", null);
__decorate([
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    (0, common_1.Get)('/auth/google/callback'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "googleCallback", null);
__decorate([
    (0, common_1.Get)('/auth/consent'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [consent_query_dto_1.ConsentQueryDto, Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "showConsentPage", null);
__decorate([
    (0, common_1.Post)('/auth/consent'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [consent_info_body_dto_1.ConsentInfoBodyDto]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "handleConsent", null);
exports.StudentController = StudentController = __decorate([
    (0, common_1.Controller)('v1/students'),
    __metadata("design:paramtypes", [student_service_1.StudentService,
        jwt_1.JwtService,
        config_1.ConfigService])
], StudentController);
//# sourceMappingURL=student.controller.js.map