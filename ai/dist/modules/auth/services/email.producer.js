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
exports.EmailProducer = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const bullmq_2 = require("bullmq");
let EmailProducer = class EmailProducer {
    constructor(emailQueue) {
        this.emailQueue = emailQueue;
    }
    async sendPasswordResetEmail(data) {
        await this.emailQueue.add('send-password-reset', data);
    }
    async sendParentPasswordResetEmail(data) {
        await this.emailQueue.add('send-parent-password-reset', data);
    }
    async sendAccountValidationEmail(data) {
        await this.emailQueue.add('send-account-validation', data);
    }
    async sendDemoInvitationEmail(data) {
        await this.emailQueue.add('send-demo-invitation', data);
    }
    async sendDemoAdminNotificationEmail(data) {
        await this.emailQueue.add('send-demo-admin-notification', data);
    }
    async sendParentDemoInvitationEmail(data) {
        await this.emailQueue.add('send-parent-demo-invitation', data);
    }
    async sendStudentDemoInvitationEmail(data) {
        await this.emailQueue.add('send-student-demo-invitation', data);
    }
    async sendLeadAdminNotificationEmail(data) {
        await this.emailQueue.add('send-lead-admin-notification', data);
    }
};
exports.EmailProducer = EmailProducer;
exports.EmailProducer = EmailProducer = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('email-queue')),
    __metadata("design:paramtypes", [bullmq_2.Queue])
], EmailProducer);
//# sourceMappingURL=email.producer.js.map