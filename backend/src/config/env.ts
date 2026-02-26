import { z } from "zod";

const emptyStringToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://postgres:postgres@localhost:5432/tutoring_toolbox"),
  JWT_SECRET: z.string().min(16).default("change-me-to-a-long-random-secret"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  EMAIL_PROVIDER: z.preprocess(
    emptyStringToUndefined,
    z.enum(["console", "azure-communication-services"]).default("console")
  ),
  ACS_CONNECTION_STRING: z.string().optional(),
  ACS_SENDER_ADDRESS: z.string().optional(),
  MICROSOFT_TENANT_ID: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_REDIRECT_URI: z.string().optional(),
});

export const env = envSchema.parse(process.env);
