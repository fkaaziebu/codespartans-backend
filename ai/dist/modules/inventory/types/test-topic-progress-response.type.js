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
exports.TestTopicProgressResponse = void 0;
const graphql_1 = require("@nestjs/graphql");
let TestTopicProgressResponse = class TestTopicProgressResponse {
};
exports.TestTopicProgressResponse = TestTopicProgressResponse;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], TestTopicProgressResponse.prototype, "topic", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], TestTopicProgressResponse.prototype, "total", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], TestTopicProgressResponse.prototype, "correct", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], TestTopicProgressResponse.prototype, "wrong", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], TestTopicProgressResponse.prototype, "score", void 0);
exports.TestTopicProgressResponse = TestTopicProgressResponse = __decorate([
    (0, graphql_1.ObjectType)('TestTopicProgressResponse')
], TestTopicProgressResponse);
//# sourceMappingURL=test-topic-progress-response.type.js.map