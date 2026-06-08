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
exports.LoginSchoolStudentResponse = void 0;
const graphql_1 = require("@nestjs/graphql");
const school_student_entity_1 = require("../entities/school-student.entity");
let LoginSchoolStudentResponse = class LoginSchoolStudentResponse extends school_student_entity_1.SchoolStudent {
};
exports.LoginSchoolStudentResponse = LoginSchoolStudentResponse;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], LoginSchoolStudentResponse.prototype, "token", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], LoginSchoolStudentResponse.prototype, "refresh_token", void 0);
exports.LoginSchoolStudentResponse = LoginSchoolStudentResponse = __decorate([
    (0, graphql_1.ObjectType)()
], LoginSchoolStudentResponse);
//# sourceMappingURL=login-school-student-response.type.js.map