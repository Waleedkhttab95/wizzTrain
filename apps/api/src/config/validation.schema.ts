import * as Joi from 'joi';

/**
 * Validated at boot so a misconfigured deployment fails fast instead of
 * failing on the first request that happens to need the missing variable.
 */
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(4000),
  API_PREFIX: Joi.string().default('api'),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),

  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),

  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min':
      'JWT_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 48',
  }),
  // A duration understood by `ms` ("7d", "15m", "90s") or a plain number of
  // seconds. Validated here so a typo fails at boot, not at first login.
  JWT_EXPIRES_IN: Joi.string()
    .pattern(/^\d+(\.\d+)?\s*(ms|s|m|h|d|w|y)?$/i)
    .default('7d')
    .messages({
      'string.pattern.base':
        'JWT_EXPIRES_IN must be a duration such as "7d", "15m", or a number of seconds',
    }),
  // Spec §5 requires >= 10; 12 is the default.
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),

  // Login throttle. Tight by default because login is the credential-stuffing
  // target; raise it for load tests or an end-to-end suite.
  LOGIN_RATE_LIMIT: Joi.number().integer().min(1).default(5),
  LOGIN_RATE_TTL_MS: Joi.number().integer().min(1000).default(60_000),

  SEED_TRAINER_NAME: Joi.string().optional(),
  // `tlds: false` because internal hostnames like `trainer@wizzapp.local` are
  // valid here and Joi's default TLD list rejects them.
  SEED_TRAINER_EMAIL: Joi.string()
    .email({ tlds: { allow: false } })
    .optional(),
  SEED_TRAINER_PASSWORD: Joi.string().min(8).optional(),
});
