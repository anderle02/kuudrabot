import { PubSubRedisBroker, RedisBrokerDiscordEvents, RedisGateway } from "@discordjs/brokers";
import { Client, GatewayDispatchEvents } from "@discordjs/core";
import { env, redis, rest } from "@kuudrabot/shared";
import { deployCommands, registerCommands } from "./commands/commandRegistry.js";
import { startHealthServer } from "./health.js";
import { handleInteraction } from "./interactionHandler.js";
import { logger } from "./utils/logger.js";

// Health server reports 200 if everything is fine.
startHealthServer();

// Register and deploy commands.
await registerCommands();
await deployCommands();

// Gateway (over redis)
const gateway = new RedisGateway(
  new PubSubRedisBroker<RedisBrokerDiscordEvents>(redis, {
    group: "workers",
    name: "worker-1",
  }),
  env.SHARD_COUNT,
);

// Discord Client
const client = new Client({ rest, gateway });
client.on(GatewayDispatchEvents.InteractionCreate, handleInteraction);

// Start accepting events
await gateway.init([GatewayDispatchEvents.InteractionCreate]);
logger.info("Listening for events...");

// Catch uncaught exceptions/rejections and log them, this is a fatal error and should be fixed.
process.on("uncaughtException", (err) => {
  logger.fatal(`The worker instance crashed. ${err}`);
  setTimeout(() => process.exit(1), 1000);
});

process.on("unhandledRejection", (reason) => {
  logger.fatal(`The worker instance crashed. ${reason}`);
  setTimeout(() => process.exit(1), 1000);
});
