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
exports.AlertResponse = void 0;
const graphql_1 = require("@nestjs/graphql");
const alert_action_type_1 = require("./alert-action.type");
let AlertResponse = class AlertResponse {
};
exports.AlertResponse = AlertResponse;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AlertResponse.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AlertResponse.prototype, "alert_type", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AlertResponse.prototype, "icon", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AlertResponse.prototype, "icon_bg", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AlertResponse.prototype, "title", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AlertResponse.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AlertResponse.prototype, "time_label", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Boolean)
], AlertResponse.prototype, "is_unread", void 0);
__decorate([
    (0, graphql_1.Field)(() => [alert_action_type_1.AlertAction]),
    __metadata("design:type", Array)
], AlertResponse.prototype, "actions", void 0);
exports.AlertResponse = AlertResponse = __decorate([
    (0, graphql_1.ObjectType)('AlertResponse')
], AlertResponse);
//# sourceMappingURL=alert-response.type.js.map