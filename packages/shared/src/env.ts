import { config } from "dotenv";
import path from "node:path";
import { z } from "zod";

config({ path: path.resolve(import.meta.dirname, "../../../.env") });

const EnvSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_APPLICATION_ID: z.string().min(1),
  DISCORD_GUILD_ID: z.string().min(1),
  HYPIXEL_API_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.url(),
  LOG_LEVEL: z.string().default("info"),
  HEALTHCHECK_PORT: z.coerce.number().default(8080),
  SHARD_COUNT: z.number().default(1),
});

export const env = EnvSchema.parse(process.env);
