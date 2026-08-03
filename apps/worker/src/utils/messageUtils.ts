import {
  ComponentType,
  MessageFlags,
  type API,
  type APIApplicationCommandInteraction,
  type APISeparatorComponent,
  type APITextDisplayComponent,
  type CreateInteractionResponseOptions,
  type EditInteractionResponseOptions,
} from "@discordjs/core";
import config from "../config.js";

export type RespondWithEmbedOptions = {
  /** Message will be invisible to anyone except the executing user. */
  ephemeral?: boolean;
  /** Will add a ⚠️ to the message and change the color to config.colors.error */
  isError?: boolean;
};

/** Reply to an interaction. Make sure the interaction has NOT been replied to or deferred before. */
export async function replyWithEmbed(
  interaction: APIApplicationCommandInteraction,
  discord: API,
  messages: Array<string>,
  options?: RespondWithEmbedOptions,
) {
  respondWithEmbed(interaction, discord, messages, false, options);
}

/** Reply to an interaction. Make sure the interaction HAS been replied to or deferred before. */
export async function editReplyWithEmbed(
  interaction: APIApplicationCommandInteraction,
  discord: API,
  messages: Array<string>,
  options?: RespondWithEmbedOptions,
) {
  respondWithEmbed(interaction, discord, messages, true, options);
}

/** Either reply or editReply to an interaction. */
async function respondWithEmbed(
  interaction: APIApplicationCommandInteraction,
  discord: API,
  messages: Array<string>,
  edit: boolean,
  options?: RespondWithEmbedOptions,
) {
  const components = new Array<APITextDisplayComponent | APISeparatorComponent>();

  if (messages.length == 0) throw new Error("[messageUtils] No message to send. This is a bug.");

  components.push({
    type: ComponentType.TextDisplay,
    content: `**${messages[0]}**`,
  });

  for (let i = 1; i < messages.length; i++) {
    components.push({ type: ComponentType.Separator });
    components.push({
      type: ComponentType.TextDisplay,
      content: messages[i]!,
    });
  }

  const payload = {
    components: [
      {
        type: ComponentType.Container,
        accent_color: options?.isError ? config.colors.error : config.colors.default,
        components,
      },
    ],
    flags: MessageFlags.IsComponentsV2 | (options?.ephemeral ? MessageFlags.Ephemeral : 0),
  };

  if (edit) {
    await discord.interactions.editReply(
      interaction.application_id,
      interaction.token,
      payload as EditInteractionResponseOptions,
    );
  } else {
    await discord.interactions.reply(
      interaction.id,
      interaction.token,
      payload as CreateInteractionResponseOptions,
    );
  }
}
