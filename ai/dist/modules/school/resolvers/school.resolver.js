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
exports.SchoolResolver = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const guards_1 = require("../../../helpers/guards");
const inputs_1 = require("../../../helpers/inputs");
const add_school_student_input_1 = require("../inputs/add-school-student.input");
const bulk_enroll_students_input_1 = require("../inputs/bulk-enroll-students.input");
const login_school_student_input_1 = require("../inputs/login-school-student.input");
const school_service_1 = require("../services/school.service");
const types_1 = require("../types");
let SchoolResolver = class SchoolResolver {
    constructor(schoolService) {
        this.schoolService = schoolService;
    }
    listSchoolStudents(context, searchTerm, pagination) {
        const { email } = context.req.user;
        return this.schoolService.listSchoolStudents(email, searchTerm, pagination);
    }
    addSchoolStudent(input, context) {
        const { email } = context.req.user;
        return this.schoolService.addSchoolStudent(email, input);
    }
    bulkEnrollStudents(input, context) {
        const { email } = context.req.user;
        return this.schoolService.bulkEnrollStudents(email, input.students);
    }
    resetStudentPin(studentId, context) {
        const { email } = context.req.user;
        return this.schoolService.resetStudentPin(email, studentId);
    }
    shareStudentLogin(studentId, context) {
        const { email } = context.req.user;
        return this.schoolService.shareStudentLogin(email, studentId);
    }
    removeSchoolStudent(studentId, context) {
        const { email } = context.req.user;
        return this.schoolService.removeSchoolStudent(email, studentId);
    }
    verifySchoolStudentUsername(username) {
        return this.schoolService.verifyStudentUsername(username);
    }
    loginSchoolStudent(input) {
        return this.schoolService.loginSchoolStudent(input.temp_token, input.pin);
    }
};
exports.SchoolResolver = SchoolResolver;
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Query)(() => types_1.SchoolStudentConnection),
    __param(0, (0, graphql_1.Context)()),
    __param(1, (0, graphql_1.Args)('searchTerm', { nullable: true })),
    __param(2, (0, graphql_1.Args)('pagination', { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, inputs_1.PaginationInput]),
    __metadata("design:returntype", void 0)
], SchoolResolver.prototype, "listSchoolStudents", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => types_1.AddStudentResponse),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [add_school_student_input_1.AddSchoolStudentInput, Object]),
    __metadata("design:returntype", void 0)
], SchoolResolver.prototype, "addSchoolStudent", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => [types_1.EnrollStudentResult]),
    __param(0, (0, graphql_1.Args)('input')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_enroll_students_input_1.BulkEnrollStudentsInput, Object]),
    __metadata("design:returntype", void 0)
], SchoolResolver.prototype, "bulkEnrollStudents", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => types_1.AddStudentResponse),
    __param(0, (0, graphql_1.Args)('studentId')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SchoolResolver.prototype, "resetStudentPin", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => types_1.AddStudentResponse),
    __param(0, (0, graphql_1.Args)('studentId')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SchoolResolver.prototype, "shareStudentLogin", null);
__decorate([
    (0, common_1.UseGuards)(guards_1.GqlJwtAuthGuard),
    (0, graphql_1.Mutation)(() => types_1.AddStudentResponse),
    __param(0, (0, graphql_1.Args)('studentId')),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SchoolResolver.prototype, "removeSchoolStudent", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_1.VerifyStudentUsernameResponse),
    __param(0, (0, graphql_1.Args)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SchoolResolver.prototype, "verifySchoolStudentUsername", null);
__decorate([
    (0, graphql_1.Mutation)(() => types_1.LoginSchoolStudentResponse),
    __param(0, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_school_student_input_1.LoginSchoolStudentInput]),
    __metadata("design:returntype", void 0)
], SchoolResolver.prototype, "loginSchoolStudent", null);
exports.SchoolResolver = SchoolResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [school_service_1.SchoolService])
], SchoolResolver);
//# sourceMappingURL=school.resolver.js.map