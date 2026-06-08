"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolStudentConnection = void 0;
const graphql_1 = require("@nestjs/graphql");
const pagination_type_1 = require("../../../helpers/types/pagination.type");
const school_student_entity_1 = require("../entities/school-student.entity");
let SchoolStudentConnection = class SchoolStudentConnection extends (0, pagination_type_1.Paginated)(school_student_entity_1.SchoolStudent) {
};
exports.SchoolStudentConnection = SchoolStudentConnection;
exports.SchoolStudentConnection = SchoolStudentConnection = __decorate([
    (0, graphql_1.ObjectType)()
], SchoolStudentConnection);
//# sourceMappingURL=school-student-connection.type.js.map