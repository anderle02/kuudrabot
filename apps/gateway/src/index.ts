import {
  RedisGateway,
  PubSubRedisBroker,
  kUseRandomGroupName,
} from "@discordjs/brokers";
import { WebSocketManager, WebSocketShardEvents } from "@discordjs/ws";
import { env, redis, rest } from "@kuudrabot/shared";
import { logger } from "./logger.js";
import { startHealthServer } from "./health.js";

// Random group name: we don't want work-balancing on gateway_send events.
const broker = new PubSubRedisBroker(redis, {
  group: kUseRandomGroupName,
  name: process.env.SERVICE_NAME || "gateway",
});

const gateway = new WebSocketManager({
  token: env.DISCORD_TOKEN,
  intents: 0,
  rest,
});

gateway.on(
  WebSocketShardEvents.Dispatch,
  (...data) => void broker.publish(...RedisGateway.toPublishArgs(data)),
);

broker.on(
  RedisGateway.GatewaySendEvent,
  async ({ data: { payload, shardId }, ack }) => {
    await gateway.send(shardId, payload);
    await ack();
  },
);

startHealthServer();
await broker.subscribe([RedisGateway.GatewaySendEvent]);
await gateway.connect();

logger.info("Gateway connected to Discord. Listening for events...");
