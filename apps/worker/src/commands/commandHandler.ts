import {
  ApplicationIntegrationType,
  PermissionFlagsBits,
  type API,
  type APIChatInputApplicationCommandInteraction,
} from "@discordjs/core";
import { isApplicationCommandGuildInteraction } from "discord-api-types/utils/v10";
import { extractInteractionContext } from "../interactionHandler.js";
import { logger } from "../utils/logger.js";
import { replyWithEmbed } from "../utils/messageUtils.js";
import { getCommand } from "./commandRegistry.js";
import type { PermissionResult } from "./types.js";

/**
 * Handles a command interaction. Currently supports:
 * - APIChatInputApplicationCommandInteraction
 */
export async function handleCommandInteraction(
  interaction: APIChatInputApplicationCommandInteraction,
  api: API,
): Promise<void> {
  const command = getCommand(interaction.data.name);

  // If the command is not registered in commandRegistry.ts
  // This only happens when commands have changed and deployed to Discord,
  // while this worker is still running with the old commands.
  if (!command) {
    logger.warn(
      {
        module: "commands",
        command: interaction.data,
      },
      "Unknown Command",
    );
    await replyWithEmbed(
      interaction,
      api,
      ["Unknown command. Please try again in a short moment."],
      {
        isError: true,
        ephemeral: true,
      },
    );
    return;
  }

  // Reject commands that are executed from outside a guild, which do not support UserInstall.
  // This should not be possible to happen at all.
  if (
    !isApplicationCommandGuildInteraction(interaction) &&
    !command.data.integration_types?.includes(ApplicationIntegrationType.UserInstall)
  ) {
    await replyWithEmbed(interaction, api, ["This command can only be used inside a server."], {
      isError: true,
      ephemeral: true,
    });
    return;
  }

  // Reject commands which are only available in specific guilds.
  // Discord shouldn't allow those either.
  if (
    isApplicationCommandGuildInteraction(interaction) &&
    command.guildId &&
    command.guildId !== interaction.guild_id
  ) {
    await replyWithEmbed(interaction, api, ["This command is not available here."], {
      isError: true,
      ephemeral: true,
    });
    return;
  }

  // Check bot permissions in the current guild.
  if (isApplicationCommandGuildInteraction(interaction) && command.botPermissions.length > 0) {
    const perms = checkBotPermissions(interaction.app_permissions, command.botPermissions);

    if (perms !== true) {
      await replyWithEmbed(
        interaction,
        api,
        [
          `The bot is missing some permissions in this Discord server:\n`,
          `${perms.map((p) => `❌ \`${p}\``).join("\n")}\n\n`,
          `In order to run this command, please give the bot all permissions mentioned above.`,
        ],
        {
          ephemeral: true,
        },
      );
      return;
    }
  }

  // Check if the user is allowed to run this command.
  const userPermissions = await command.userPermissions(interaction);
  if (userPermissions !== true) {
    await replyWithEmbed(
      interaction,
      api,
      [
        `You are not allowed to run this command.`,
        `${userPermissions.map((p) => `❌ \`${p}\``).join("\n")}`,
      ],
      { ephemeral: true },
    );
    return;
  }

  // Execute the command
  try {
    await command.execute(interaction, api);
  } catch (err) {
    logger.error({ err: err as Error, ...extractInteractionContext(interaction) }, "Command Error");

    try {
      await replyWithEmbed(interaction, api, [`An unexpected error occurred.`, `\`${err}\``], {
        isError: true,
        ephemeral: true,
      });
    } catch (err2) {
      // This is not supposed to happen at all. Either there's no Discord connection or there is a bug.
      logger.error(err2 as Error, "Failed to send error reply.");
    }
  }
}

/** Checks whether botPermissionsString has all requiredPermissions
 * and returns true or a list with missing permissions. */
function checkBotPermissions(
  botPermissionsString: string,
  requiredPermissions: bigint[],
): PermissionResult {
  const botPermissions = BigInt(botPermissionsString ?? 0);

  if ((botPermissions & PermissionFlagsBits.Administrator) === PermissionFlagsBits.Administrator) {
    return true;
  }

  const missingPermissionNames = new Array<string>();
  const permissionEntries = Object.entries(PermissionFlagsBits);

  for (const permission of requiredPermissions) {
    if ((botPermissions & permission) !== permission) {
      const match = permissionEntries.find(([, bit]) => bit === permission);
      missingPermissionNames.push(match ? match[0] : "UnknownPermission");
    }
  }

  return missingPermissionNames.length === 0 ? true : missingPermissionNames;
}
