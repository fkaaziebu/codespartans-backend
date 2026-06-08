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
var StudentController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentController = exports.ResumeTestDto = exports.PauseTestDto = exports.StartTestDto = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const student_gateway_1 = require("../gateways/student.gateway");
const services_1 = require("../services");
class StartTestDto {
}
exports.StartTestDto = StartTestDto;
class PauseTestDto {
}
exports.PauseTestDto = PauseTestDto;
class ResumeTestDto {
}
exports.ResumeTestDto = ResumeTestDto;
let StudentController = StudentController_1 = class StudentController {
    constructor(studentService, sseGateway) {
        this.studentService = studentService;
        this.sseGateway = sseGateway;
        this.logger = new common_1.Logger(StudentController_1.name);
    }
    streamTestTime(testId, studentId) {
        this.logger.log(`SSE stream started for test ${testId}, student ${studentId}`);
        const subject = this.sseGateway.registerConnection(testId, studentId);
        this.studentService
            .handleStudentReconnection(testId, studentId)
            .catch((error) => {
            this.logger.error(`Error handling reconnection for test ${testId}, student ${studentId}`, error);
        });
        return subject.pipe((0, operators_1.map)((data) => ({
            data,
        })));
    }
    async streamActiveTests(studentId) {
        const subject = this.sseGateway.registerActiveTestConnection(studentId);
        try {
            const activeTest = await this.studentService.getActiveTest(studentId);
            if (!activeTest) {
                throw new common_1.BadRequestException('No active test for this student');
            }
            this.studentService
                .handleStudentReconnection(activeTest?.id, studentId)
                .catch((error) => {
                this.logger.error(`Error handling reconnection for student ${studentId}`, error);
            });
            return subject.pipe((0, operators_1.map)((data) => ({
                data,
            })));
        }
        catch (error) {
            return subject.pipe((0, operators_1.map)((data) => ({
                data,
            })));
        }
    }
};
exports.StudentController = StudentController;
__decorate([
    (0, common_1.Get)(':testId/:studentId/stream'),
    (0, common_1.Sse)(),
    __param(0, (0, common_1.Param)('testId')),
    __param(1, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", rxjs_1.Observable)
], StudentController.prototype, "streamTestTime", null);
__decorate([
    (0, common_1.Get)(':studentId/stream'),
    (0, common_1.Sse)(),
    __param(0, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "streamActiveTests", null);
exports.StudentController = StudentController = StudentController_1 = __decorate([
    (0, common_1.Controller)('tests'),
    __metadata("design:paramtypes", [services_1.StudentService,
        student_gateway_1.StudentGateway])
], StudentController);
//# sourceMappingURL=student.controller.js.map