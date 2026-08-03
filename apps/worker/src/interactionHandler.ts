import { type APIInteraction, InteractionType, type ToEventProps } from "@discordjs/core";
import {
  isChatInputApplicationCommandInteraction,
  isGuildInteraction,
  isMessageComponentInteraction,
} from "discord-api-types/utils/v10";
import { handleCommandInteraction } from "./commands/commandHandler.js";

/** Take an incoming interaction and give it to the correct handler. */
export async function handleInteraction({ api, data }: ToEventProps<APIInteraction>) {
  // Commands
  if (data.type === InteractionType.ApplicationCommand) {
    if (isChatInputApplicationCommandInteraction(data)) {
      await handleCommandInteraction(data, api);
      return;
    }

    return;
  }

  // Components
  if (isMessageComponentInteraction(data)) {
    return;
  }
}

/** Get useful data from any APIInteraction that might be useful for logging. */
export function extractInteractionContext(interaction: APIInteraction) {
  const result: Record<string, unknown> = {
    interactionType: interaction.type,
    userId: interaction.member?.user?.id || interaction.user?.id,
    channel: interaction.channel?.id,
    channelType: interaction.channel?.type,
  };

  if (interaction.type === InteractionType.ApplicationCommand) {
    result.command = interaction.data;
  }

  if (interaction.type === InteractionType.MessageComponent) {
    result.component = interaction.data;
  }

  if (isGuildInteraction(interaction)) {
    result.guild = interaction.guild_id;
  }

  return result;
}
