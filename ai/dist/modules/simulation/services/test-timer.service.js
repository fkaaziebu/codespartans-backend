"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TestTimerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestTimerService = void 0;
const common_1 = require("@nestjs/common");
let TestTimerService = TestTimerService_1 = class TestTimerService {
    constructor() {
        this.logger = new common_1.Logger(TestTimerService_1.name);
        this.activeTimers = new Map();
    }
    startTimer(testId, studentId, endTime, onTick, onEnd) {
        const timerId = `${testId}-${studentId}`;
        this.stopTimer(testId, studentId);
        const interval = setInterval(() => {
            const now = new Date();
            const remainingMs = endTime.getTime() - now.getTime();
            if (remainingMs <= 0) {
                this.logger.log(`Test ${testId} for student ${studentId} has ended`);
                this.stopTimer(testId, studentId);
                onEnd();
            }
            else {
                onTick(remainingMs);
            }
        }, 1000);
        this.activeTimers.set(timerId, {
            testId,
            studentId,
            endTime,
            interval,
        });
        this.logger.log(`Timer started for test ${testId}, student ${studentId}. Ends at ${endTime}`);
    }
    stopTimer(testId, studentId) {
        const timerId = `${testId}-${studentId}`;
        const timer = this.activeTimers.get(timerId);
        if (timer) {
            clearInterval(timer.interval);
            this.activeTimers.delete(timerId);
            this.logger.log(`Timer stopped for test ${testId}, student ${studentId}`);
        }
    }
    getRemainingTime(endTime) {
        const now = new Date();
        return Math.max(0, endTime.getTime() - now.getTime());
    }
    hasTestExpired(endTime) {
        return this.getRemainingTime(endTime) <= 0;
    }
    pauseTimer(testId, studentId) {
        const timerId = `${testId}-${studentId}`;
        const timer = this.activeTimers.get(timerId);
        if (timer) {
            const now = new Date();
            const remainingMs = timer.endTime.getTime() - now.getTime();
            this.stopTimer(testId, studentId);
            this.logger.log(`Timer paused for test ${testId}, student ${studentId}. Remaining: ${remainingMs}ms`);
            return remainingMs;
        }
        return null;
    }
    resumeTimer(testId, studentId, endTime, onTick, onEnd) {
        this.startTimer(testId, studentId, endTime, onTick, onEnd);
        this.logger.log(`Timer resumed for test ${testId}, student ${studentId}. New end time: ${endTime}`);
    }
    getActiveTimers() {
        return Array.from(this.activeTimers.values());
    }
    clearAllTimers() {
        this.activeTimers.forEach((timer) => {
            clearInterval(timer.interval);
        });
        this.activeTimers.clear();
        this.logger.log('All timers cleared');
    }
};
exports.TestTimerService = TestTimerService;
exports.TestTimerService = TestTimerService = TestTimerService_1 = __decorate([
    (0, common_1.Injectable)()
], TestTimerService);
//# sourceMappingURL=test-timer.service.js.map