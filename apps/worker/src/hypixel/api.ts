import { env } from "@kuudrabot/shared";
import { Client as HypixelClient } from "hypixel-api-reborn";

if (!env.HYPIXEL_API_KEY) throw new Error("Missing HYPIXEL_API_KEY");

/**
 * Use this for any Hypixel API requests.
 * @link Documentation: https://hypixel-api-reborn.github.io/hypixel-api-reborn/
 */
export const hypixel = new HypixelClient(env.HYPIXEL_API_KEY);
