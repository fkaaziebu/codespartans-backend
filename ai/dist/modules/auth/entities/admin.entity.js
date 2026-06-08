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
exports.Admin = exports.AdminStatusType = void 0;
const class_transformer_1 = require("class-transformer");
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const version_entity_1 = require("../../review/entities/version.entity");
var AdminStatusType;
(function (AdminStatusType) {
    AdminStatusType["ACTIVE"] = "ACTIVE";
    AdminStatusType["INACTIVE"] = "INACTIVE";
})(AdminStatusType || (exports.AdminStatusType = AdminStatusType = {}));
(0, graphql_1.registerEnumType)(AdminStatusType, {
    name: 'AdminStatusType',
    description: 'Admin status',
});
let Admin = class Admin {
};
exports.Admin = Admin;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Admin.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Admin.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Admin.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_transformer_1.Exclude)({ toPlainOnly: true }),
    __metadata("design:type", String)
], Admin.prototype, "password", void 0);
__decorate([
    (0, graphql_1.Field)(() => AdminStatusType),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AdminStatusType,
        default: AdminStatusType.ACTIVE,
    }),
    __metadata("design:type", String)
], Admin.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)(() => organization_entity_1.Organization, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, (organization) => organization.admins),
    __metadata("design:type", organization_entity_1.Organization)
], Admin.prototype, "organization", void 0);
__decorate([
    (0, graphql_1.Field)(() => [version_entity_1.Version], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => version_entity_1.Version, (version) => version.assigned_admin),
    __metadata("design:type", Array)
], Admin.prototype, "assigned_course_versions_for_review", void 0);
exports.Admin = Admin = __decorate([
    (0, graphql_1.ObjectType)('Admin'),
    (0, typeorm_1.Entity)('admins')
], Admin);
//# sourceMappingURL=admin.entity.js.map