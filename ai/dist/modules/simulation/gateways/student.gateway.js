"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var StudentGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentGateway = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let StudentGateway = StudentGateway_1 = class StudentGateway {
    constructor() {
        this.logger = new common_1.Logger(StudentGateway_1.name);
        this.activeConnections = new Map();
        this.activeTestConnections = new Map();
    }
    registerConnection(testId, studentId) {
        const connectionId = `${testId}-${studentId}`;
        const existingConnection = this.activeConnections.get(connectionId);
        if (existingConnection) {
            existingConnection.subject.complete();
        }
        const subject = new rxjs_1.Subject();
        this.activeConnections.set(connectionId, {
            testId,
            studentId,
            subject,
        });
        this.logger.log(`SSE connection registered for test ${testId}, student ${studentId}`);
        subject.subscribe({
            complete: () => {
                this.logger.log(`SSE connection completed for test ${testId}, student ${studentId}`);
                this.activeConnections.delete(connectionId);
            },
        });
        return subject;
    }
    registerActiveTestConnection(studentId) {
        const connectionId = `${studentId}`;
        const existingConnection = this.activeTestConnections.get(connectionId);
        if (existingConnection) {
            existingConnection.subject.complete();
        }
        const subject = new rxjs_1.Subject();
        this.activeTestConnections.set(connectionId, {
            studentId,
            subject,
        });
        this.logger.log(`SSE connection registered for student ${studentId}`);
        subject.subscribe({
            complete: () => {
                this.logger.log(`SSE connection completed for student ${studentId}`);
                this.activeTestConnections.delete(connectionId);
            },
        });
        return subject;
    }
    sendTimeUpdate(testId, studentId, remainingMs) {
        const connectionId = `${testId}-${studentId}`;
        const connection = this.activeConnections.get(connectionId);
        if (connection) {
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            connection.subject.next({
                type: 'time_update',
                remainingSeconds,
                remainingMs,
                timestamp: new Date(),
            });
        }
        const testConnection = this.activeTestConnections.get(studentId);
        if (testConnection) {
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            testConnection.subject.next({
                type: 'time_update',
                testId,
                remainingSeconds,
                remainingMs,
                timestamp: new Date(),
            });
        }
    }
    sendTestEnded(testId, studentId) {
        const connectionId = `${testId}-${studentId}`;
        const connection = this.activeConnections.get(connectionId);
        if (connection) {
            connection.subject.next({
                type: 'test_ended',
                timestamp: new Date(),
            });
            connection.subject.complete();
        }
        const testConnection = this.activeTestConnections.get(studentId);
        if (testConnection) {
            testConnection.subject.next({
                type: 'test_ended',
                testId,
                timestamp: new Date(),
            });
            testConnection.subject.complete();
        }
    }
    sendTestPaused(testId, studentId, remainingMs) {
        const connectionId = `${testId}-${studentId}`;
        const connection = this.activeConnections.get(connectionId);
        if (connection) {
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            connection.subject.next({
                type: 'test_paused',
                remainingSeconds,
                remainingMs,
                timestamp: new Date(),
            });
        }
        const testConnection = this.activeTestConnections.get(studentId);
        if (testConnection) {
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            testConnection.subject.next({
                type: 'test_paused',
                testId,
                remainingSeconds,
                remainingMs,
                timestamp: new Date(),
            });
        }
    }
    sendTestResumed(testId, studentId, remainingMs) {
        const connectionId = `${testId}-${studentId}`;
        const connection = this.activeConnections.get(connectionId);
        if (connection) {
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            connection.subject.next({
                type: 'test_resumed',
                remainingSeconds,
                remainingMs,
                timestamp: new Date(),
            });
        }
        const testConnection = this.activeTestConnections.get(studentId);
        if (testConnection) {
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            testConnection.subject.next({
                type: 'test_resumed',
                testId,
                remainingSeconds,
                remainingMs,
                timestamp: new Date(),
            });
        }
    }
    disconnectStudent(testId, studentId) {
        const connectionId = `${testId}-${studentId}`;
        const connection = this.activeConnections.get(connectionId);
        if (connection) {
            connection.subject.complete();
            this.activeConnections.delete(connectionId);
            this.logger.log(`SSE connection disconnected for test ${testId}, student ${studentId}`);
        }
        const testConnection = this.activeTestConnections.get(studentId);
        if (testConnection) {
            testConnection.subject.complete();
            this.activeTestConnections.delete(studentId);
            this.logger.log(`SSE connection disconnected for test ${testId}, student ${studentId}`);
        }
    }
    getActiveConnections() {
        return Array.from(this.activeConnections.values());
    }
    clearAllConnections() {
        this.activeConnections.forEach((connection) => {
            connection.subject.complete();
        });
        this.activeConnections.clear();
        this.logger.log('All SSE connections cleared');
    }
};
exports.StudentGateway = StudentGateway;
exports.StudentGateway = StudentGateway = StudentGateway_1 = __decorate([
    (0, common_1.Injectable)()
], StudentGateway);
//# sourceMappingURL=student.gateway.js.map