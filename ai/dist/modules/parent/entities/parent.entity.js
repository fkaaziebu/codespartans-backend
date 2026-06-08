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
exports.Parent = exports.Gender = void 0;
const class_transformer_1 = require("class-transformer");
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const child_entity_1 = require("./child.entity");
var Gender;
(function (Gender) {
    Gender["Male"] = "Male";
    Gender["Female"] = "Female";
})(Gender || (exports.Gender = Gender = {}));
(0, graphql_1.registerEnumType)(Gender, {
    name: 'Gender',
    description: 'Parent gender',
});
let Parent = class Parent {
};
exports.Parent = Parent;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Parent.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Parent.prototype, "first_name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Parent.prototype, "last_name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Parent.prototype, "email", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Parent.prototype, "whatsapp_number", void 0);
__decorate([
    (0, graphql_1.Field)(() => Gender),
    (0, typeorm_1.Column)({ type: 'enum', enum: Gender, default: Gender.Male }),
    __metadata("design:type", String)
], Parent.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_transformer_1.Exclude)({ toPlainOnly: true }),
    __metadata("design:type", String)
], Parent.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Parent.prototype, "is_account_validated", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Parent.prototype, "is_setup_completed", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Parent.prototype, "validation_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Parent.prototype, "reset_token", void 0);
__decorate([
    (0, graphql_1.Field)(() => [child_entity_1.Child], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => child_entity_1.Child, (child) => child.parent),
    __metadata("design:type", Array)
], Parent.prototype, "children", void 0);
exports.Parent = Parent = __decorate([
    (0, graphql_1.ObjectType)('Parent'),
    (0, typeorm_1.Entity)('parents')
], Parent);
//# sourceMappingURL=parent.entity.js.map