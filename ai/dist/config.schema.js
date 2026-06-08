"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configValidationSchema = void 0;
const Joi = require("@hapi/joi");
exports.configValidationSchema = Joi.object({
    PORT: Joi.number().default(4000).required(),
    JWT_SECRET: Joi.string().required(),
    DATABASE_URL: Joi.string().required(),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().default(5432).required(),
    DB_NAME: Joi.string().required(),
    DB_NAME_TEST: Joi.string().required(),
    GENPOP_EMAIL: Joi.string().required(),
    EMAIL_FROM: Joi.string().required(),
    GMAIL_APP_PASSWORD: Joi.string().required(),
    GMAIL_USER: Joi.string().required(),
    EMAIL_HOST: Joi.string().required(),
    STUDENT_URL: Joi.string().required(),
    PAYSTACK_SECRET_KEY: Joi.string().required(),
    SCHOOL_DEMO_URL: Joi.string().default('http://localhost:3000'),
    PARENT_URL: Joi.string().default('http://localhost:3000'),
    ANTHROPIC_API_KEY: Joi.string().required(),
});
//# sourceMappingURL=config.schema.js.map