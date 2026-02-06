import * as Joi from '@hapi/joi';

export const configValidationSchema = Joi.object({
  // STAGE: Joi.string().required(),
  PORT: Joi.number().default(4000).required(),
  JWT_SECRET: Joi.string().required(),
  // REDIS_URL: Joi.string().required(),
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
});
