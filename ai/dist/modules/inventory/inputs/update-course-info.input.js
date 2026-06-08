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
exports.UpdateCourseInfoInput = void 0;
const graphql_1 = require("@nestjs/graphql");
const course_entity_1 = require("../entities/course.entity");
let UpdateCourseInfoInput = class UpdateCourseInfoInput {
};
exports.UpdateCourseInfoInput = UpdateCourseInfoInput;
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UpdateCourseInfoInput.prototype, "title", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UpdateCourseInfoInput.prototype, "avatar_url", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], UpdateCourseInfoInput.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(() => [course_entity_1.DomainType], { nullable: true }),
    __metadata("design:type", Array)
], UpdateCourseInfoInput.prototype, "domains", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Number)
], UpdateCourseInfoInput.prototype, "price", void 0);
__decorate([
    (0, graphql_1.Field)(() => course_entity_1.CurrencyType, { nullable: true }),
    __metadata("design:type", String)
], UpdateCourseInfoInput.prototype, "currency", void 0);
exports.UpdateCourseInfoInput = UpdateCourseInfoInput = __decorate([
    (0, graphql_1.InputType)()
], UpdateCourseInfoInput);
//# sourceMappingURL=update-course-info.input.js.map