import { z } from "zod";

// Helper function to get environment variable or throw error
const getEnv = (key: string): string => {
  const value = process.env[key];
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

// Define schemas for different environment variables
const DatabaseSchema = z.object({
  DATABASE_URL: z.string().url("Invalid database URL"),
  DATABASE_SSL: z
    .string()
    .optional()
    .default("false")
    .transform((val) => val === "true"),
  DATABASE_POOL_MIN: z.string().default("2").transform(Number),
  DATABASE_POOL_MAX: z.string().default("10").transform(Number),
});

const ServerSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("4000").transform(Number),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGINS: z
    .string()
    .default("*")
    .transform((origins) => origins.split(",").map((origin) => origin.trim())),
  API_PREFIX: z.string().default("/api"),
  API_VERSION: z.string().default("v1"),
});

const AuthSchema = z.object({
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters long"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  PASSWORD_SALT_ROUNDS: z.string().default("10").transform(Number),
  RATE_LIMIT_WINDOW_MS: z.string().default("900000").transform(Number), // 15 minutes
  RATE_LIMIT_MAX: z.string().default("100").transform(Number),
});

const RedisSchema = z.object({
  REDIS_URL: z.string().url("Invalid Redis URL").default("redis://localhost:6379"),
  REDIS_TTL: z.string().default("3600").transform(Number), // 1 hour
  REDIS_PREFIX: z.string().default("modular-saas:"),
});

const SentrySchema = z.object({
  SENTRY_DSN: z.string().url("Invalid Sentry DSN").optional().or(z.literal("")),
  SENTRY_ENVIRONMENT: z.string().default("development"),
});

// Merge all schemas
const ConfigSchema = z.object({
  ...DatabaseSchema.shape,
  ...ServerSchema.shape,
  ...AuthSchema.shape,
  ...RedisSchema.shape,
  ...SentrySchema.shape,
});

// Parse and validate the environment variables
export const parseConfig = () => {
  try {
    // Load .env file based on NODE_ENV
    const env = process.env.NODE_ENV || "development";
    require("dotenv").config({ path: `.env.${env}.local` });
    require("dotenv").config({ path: `.env.${env}` });
    require("dotenv").config({ path: ".env.local" });
    require("dotenv").config();

    // Validate and parse environment variables
    const config = ConfigSchema.parse(process.env);

    console.log("DEBUG: Parsed config from Zod:", JSON.stringify(config, null, 2));

    // Add computed properties
    const result = {
      ...config,
      isDevelopment: env === "development",
      isProduction: env === "production",
      isTest: env === "test",
      api: {
        prefix: config.API_PREFIX,
        version: config.API_VERSION,
        basePath: `${config.API_PREFIX}/${config.API_VERSION}`,
      },
      database: {
        url: config.DATABASE_URL,
        ssl: config.DATABASE_SSL,
        pool: {
          min: config.DATABASE_POOL_MIN,
          max: config.DATABASE_POOL_MAX,
        },
      },
      server: {
        env: config.NODE_ENV,
        port: config.PORT,
        host: config.HOST,
        cors: {
          origins: config.CORS_ORIGINS,
        },
      },
      auth: {
        jwtSecret: config.JWT_SECRET,
        jwtExpiresIn: config.JWT_EXPIRES_IN,
        refreshTokenExpiresIn: config.REFRESH_TOKEN_EXPIRES_IN,
        passwordSaltRounds: config.PASSWORD_SALT_ROUNDS,
        rateLimit: {
          windowMs: config.RATE_LIMIT_WINDOW_MS,
          max: config.RATE_LIMIT_MAX,
        },
      },
      redis: {
        url: config.REDIS_URL,
        ttl: config.REDIS_TTL,
        prefix: config.REDIS_PREFIX,
      },
      sentry: {
        dsn: config.SENTRY_DSN,
        environment: config.SENTRY_ENVIRONMENT,
      },
    };

    console.log("DEBUG: Final result:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment variables:", error.errors);
      process.exit(1);
    }
    throw error;
  }
};

export type Config = ReturnType<typeof parseConfig>;
