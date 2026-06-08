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
exports.VersionResponse = void 0;
const graphql_1 = require("@nestjs/graphql");
const version_entity_1 = require("../entities/version.entity");
const review_response_type_1 = require("./review-response.type");
let VersionResponse = class VersionResponse extends version_entity_1.Version {
};
exports.VersionResponse = VersionResponse;
__decorate([
    (0, graphql_1.Field)(() => [review_response_type_1.ReviewResponse]),
    __metadata("design:type", Array)
], VersionResponse.prototype, "reviews", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], VersionResponse.prototype, "total_questions", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], VersionResponse.prototype, "total_reviews", void 0);
exports.VersionResponse = VersionResponse = __decorate([
    (0, graphql_1.ObjectType)('VersionResponse')
], VersionResponse);
//# sourceMappingURL=version-response.type.js.map