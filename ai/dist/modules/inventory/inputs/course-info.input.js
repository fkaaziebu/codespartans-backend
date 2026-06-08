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
exports.CourseInfoInput = void 0;
const graphql_1 = require("@nestjs/graphql");
const course_entity_1 = require("../entities/course.entity");
let CourseInfoInput = class CourseInfoInput {
};
exports.CourseInfoInput = CourseInfoInput;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CourseInfoInput.prototype, "title", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CourseInfoInput.prototype, "avatar_url", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], CourseInfoInput.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(() => [course_entity_1.DomainType], { nullable: false }),
    __metadata("design:type", Array)
], CourseInfoInput.prototype, "domains", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], CourseInfoInput.prototype, "price", void 0);
__decorate([
    (0, graphql_1.Field)(() => course_entity_1.CurrencyType),
    __metadata("design:type", String)
], CourseInfoInput.prototype, "currency", void 0);
__decorate([
    (0, graphql_1.Field)(() => course_entity_1.LevelType),
    __metadata("design:type", String)
], CourseInfoInput.prototype, "level", void 0);
exports.CourseInfoInput = CourseInfoInput = __decorate([
    (0, graphql_1.InputType)()
], CourseInfoInput);
//# sourceMappingURL=course-info.input.js.map