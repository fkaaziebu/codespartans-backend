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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const student_service_1 = require("../../modules/auth/services/student.service");
let GoogleStrategy = class GoogleStrategy extends (0, passport_1.PassportStrategy)(passport_google_oauth20_1.Strategy) {
    constructor(configService, studentService) {
        super({
            clientID: configService.get('GOOGLE_CLIENT_ID'),
            clientSecret: configService.get('GOOGLE_SECRET'),
            callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
            scope: ['email', 'profile'],
        });
        this.configService = configService;
        this.studentService = studentService;
    }
    async validate(accessToken, refreshToken, profile, done) {
        const user = await this.studentService.validateGoogleUser({
            email: profile.emails[0].value,
            password: '',
        });
        if (!user) {
            const consentData = {
                email: profile.emails[0].value,
                firstName: profile.name.givenName ? profile.name.givenName : '',
                lastName: profile.name.familyName ? profile.name.familyName : '',
                accessToken,
                refreshToken,
            };
            return done(null, { needsConsent: true, consentData });
        }
        done(null, user);
    }
};
exports.GoogleStrategy = GoogleStrategy;
exports.GoogleStrategy = GoogleStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        student_service_1.StudentService])
], GoogleStrategy);
//# sourceMappingURL=google.strategy.js.map