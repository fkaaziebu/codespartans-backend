"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeilisearchConsumer = exports.MeilisearchProducer = exports.MeilisearchService = exports.InstructorService = exports.AdminService = void 0;
var admin_service_1 = require("./admin.service");
Object.defineProperty(exports, "AdminService", { enumerable: true, get: function () { return admin_service_1.AdminService; } });
var instructor_service_1 = require("./instructor.service");
Object.defineProperty(exports, "InstructorService", { enumerable: true, get: function () { return instructor_service_1.InstructorService; } });
var meilisearch_service_1 = require("./meilisearch.service");
Object.defineProperty(exports, "MeilisearchService", { enumerable: true, get: function () { return meilisearch_service_1.MeilisearchService; } });
var meilisearch_producer_1 = require("./meilisearch.producer");
Object.defineProperty(exports, "MeilisearchProducer", { enumerable: true, get: function () { return meilisearch_producer_1.MeilisearchProducer; } });
var meilisearch_consumer_1 = require("./meilisearch.consumer");
Object.defineProperty(exports, "MeilisearchConsumer", { enumerable: true, get: function () { return meilisearch_consumer_1.MeilisearchConsumer; } });
//# sourceMappingURL=index.js.map