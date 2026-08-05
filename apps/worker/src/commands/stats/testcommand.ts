import {
  type APIApplicationCommandInteractionDataStringOption,
  ApplicationCommandOptionType,
} from "@discordjs/core";
import assert from "node:assert";
import { hypixel } from "../../hypixel/api.js";
import { editReplyWithEmbed } from "../../utils/messageUtils.js";
import type { Command } from "../types.js";

const ignOptionName = "ign";

export const command: Command = {
  name: "test",
  description: "does things owo",
  data: {
    options: [
      {
        name: ignOptionName,
        description: "player name",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  // the bot doesn't need any permissions to execute the command
  botPermissions: [],
  // anyone can use this command
  userPermissions: async () => {
    return true as const;
  },
  execute: async (interaction, discord) => {
    const ign = interaction.data.options?.find(
      (opt): opt is APIApplicationCommandInteractionDataStringOption =>
        opt.name === ignOptionName && opt.type === ApplicationCommandOptionType.String,
    )?.value;

    if (!ign) {
      // This will probably never happen but it's better than using '!'
      throw new Error(`Option ${ignOptionName} not found. Maybe the command is outdated?`);
    }

    // "defer" means make the bot reply with "kuudrabot is thinking..."
    // we need that because the hypixel api request might take a bit
    await discord.interactions.defer(interaction.id, interaction.token);

    // this should be self explanatory
    const profiles = await hypixel.getSkyBlockProfiles(ign);
    assert(profiles.mowojangProfile);
    const selectedProfile = profiles.parsed.selectedProfile;
    if (!selectedProfile) {
      throw new Error(
        `${profiles.mowojangProfile.username} does not have a selected SkyBlock profile`,
      );
    }
    const t5runs = selectedProfile.me.crimsonIsle.kuudra.infernalCompletions;

    // We use EDIT reply because the interaction has been deferred
    await editReplyWithEmbed(interaction, discord, [
      `${ign} has ${t5runs} infernal kuudra completions.`,
    ]);
  },
};
