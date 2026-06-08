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
exports.AdminResponse = void 0;
const graphql_1 = require("@nestjs/graphql");
const admin_entity_1 = require("../../auth/entities/admin.entity");
let AdminResponse = class AdminResponse extends admin_entity_1.Admin {
};
exports.AdminResponse = AdminResponse;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], AdminResponse.prototype, "total_course_versions", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], AdminResponse.prototype, "total_approved_course_versions", void 0);
exports.AdminResponse = AdminResponse = __decorate([
    (0, graphql_1.ObjectType)('AdminResponse')
], AdminResponse);
//# sourceMappingURL=admin-response.type.js.map