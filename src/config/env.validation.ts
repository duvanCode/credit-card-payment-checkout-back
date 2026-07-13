import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  DATABASE_URL: Joi.string().uri().required(),
  PAYMENT_GATEWAY_SANDBOX_URL: Joi.string().uri().required(),
  PAYMENT_GATEWAY_PUBLIC_KEY: Joi.string().required(),
  PAYMENT_GATEWAY_PRIVATE_KEY: Joi.string().required(),
  PAYMENT_GATEWAY_EVENTS_KEY: Joi.string().allow('').optional(),
  PAYMENT_GATEWAY_INTEGRITY_KEY: Joi.string().required(),
  TRANSACTION_SYNC_INTERVAL_SECONDS: Joi.number().integer().min(30).default(300),
});
