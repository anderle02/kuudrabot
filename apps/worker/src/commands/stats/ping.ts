import { replyWithEmbed } from "../../utils/messageUtils.js";
import type { Command } from "../types.js";

export const command: Command = {
  name: "ping",
  description: "Replies with pong",
  data: {},
  botPermissions: [],
  userPermissions: async () => {
    return true as const;
  },
  execute: async (interaction, api) => {
    await replyWithEmbed(interaction, api, ["Pong!"]);
  },
};
