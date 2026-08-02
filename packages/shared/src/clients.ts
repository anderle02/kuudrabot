import { REST } from "@discordjs/rest";
import { Redis } from "ioredis";
import { env } from "./env.js";

export const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);
export const redis = new Redis(env.REDIS_URL);
