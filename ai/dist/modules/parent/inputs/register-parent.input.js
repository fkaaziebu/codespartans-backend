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
exports.RegisterParentInput = void 0;
const graphql_1 = require("@nestjs/graphql");
const parent_entity_1 = require("../entities/parent.entity");
let RegisterParentInput = class RegisterParentInput {
};
exports.RegisterParentInput = RegisterParentInput;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], RegisterParentInput.prototype, "first_name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], RegisterParentInput.prototype, "last_name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], RegisterParentInput.prototype, "email", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], RegisterParentInput.prototype, "whatsapp_number", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], RegisterParentInput.prototype, "password", void 0);
__decorate([
    (0, graphql_1.Field)(() => parent_entity_1.Gender, { nullable: true }),
    __metadata("design:type", String)
], RegisterParentInput.prototype, "gender", void 0);
exports.RegisterParentInput = RegisterParentInput = __decorate([
    (0, graphql_1.InputType)()
], RegisterParentInput);
//# sourceMappingURL=register-parent.input.js.map