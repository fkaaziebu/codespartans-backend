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
exports.TimeEvent = exports.TimeEventType = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
const test_entity_1 = require("./test.entity");
var TimeEventType;
(function (TimeEventType) {
    TimeEventType["STARTED"] = "STARTED";
    TimeEventType["PAUSED"] = "PAUSED";
    TimeEventType["RESUMED"] = "RESUMED";
    TimeEventType["ENDED"] = "ENDED";
})(TimeEventType || (exports.TimeEventType = TimeEventType = {}));
(0, graphql_1.registerEnumType)(TimeEventType, {
    name: 'TimeEventType',
    description: 'Time event type',
});
let TimeEvent = class TimeEvent {
};
exports.TimeEvent = TimeEvent;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TimeEvent.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => TimeEventType),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TimeEventType,
        default: TimeEventType.STARTED,
    }),
    __metadata("design:type", String)
], TimeEvent.prototype, "type", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], TimeEvent.prototype, "recorded_at", void 0);
__decorate([
    (0, graphql_1.Field)(() => test_entity_1.Test, { nullable: true }),
    (0, typeorm_1.ManyToOne)(() => test_entity_1.Test, (test) => test.time_events),
    __metadata("design:type", test_entity_1.Test)
], TimeEvent.prototype, "test", void 0);
exports.TimeEvent = TimeEvent = __decorate([
    (0, graphql_1.ObjectType)('TimeEvent'),
    (0, typeorm_1.Entity)('time_events')
], TimeEvent);
//# sourceMappingURL=time_event.entity.js.map