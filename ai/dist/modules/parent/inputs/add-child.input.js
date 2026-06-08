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
exports.AddChildInput = void 0;
const graphql_1 = require("@nestjs/graphql");
const child_entity_1 = require("../entities/child.entity");
let AddChildInput = class AddChildInput {
};
exports.AddChildInput = AddChildInput;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AddChildInput.prototype, "full_name", void 0);
__decorate([
    (0, graphql_1.Field)(() => child_entity_1.ClassLevel),
    __metadata("design:type", String)
], AddChildInput.prototype, "class_level", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AddChildInput.prototype, "target_exam", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], AddChildInput.prototype, "school_name", void 0);
exports.AddChildInput = AddChildInput = __decorate([
    (0, graphql_1.InputType)()
], AddChildInput);
//# sourceMappingURL=add-child.input.js.map