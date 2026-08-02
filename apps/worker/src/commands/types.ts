import type { API } from "@discordjs/core";
import type {
  APIChatInputApplicationCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Snowflake,
} from "discord-api-types/v10";

export type PermissionResult = true | string[];

/** Name and description are not needed here yet.
 * They will be added from the Command object during registration. */
export type CommandDataPayload = Omit<
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  "name" | "description"
>;

export interface Command {
  /** Command Name. */
  name: string;
  /** Command Description */
  description: string;
  /** Add a guildId to limit this command's visibility to only this guild. */
  guildId?: Snowflake;
  /** Permissions required for the bot to execute this command. Use PermissionFlagsBits. */
  botPermissions: bigint[];
  /** Check whether the user is allowed to run this command. Returns true or a list of missing permissions. */
  userPermissions: (
    interaction: APIChatInputApplicationCommandInteraction,
  ) => PermissionResult | Promise<PermissionResult>;
  /** The raw JSON body of a slash command. One may use @discordjs/builders and call builders.toJSON(). */
  data: CommandDataPayload;
  /** The function called when someone executes the commands and all checks have passed. */
  execute: (interaction: APIChatInputApplicationCommandInteraction, api: API) => Promise<void>;
}
