import {
  ComponentType,
  MessageFlags,
  type API,
  type APIApplicationCommandInteraction,
  type APISeparatorComponent,
  type APITextDisplayComponent,
} from "@discordjs/core";
import config from "../config.js";

export type ReplyWithEmbedOptions = {
  /** Message will be invisible to anyone except the executing user. */
  ephemeral?: boolean;
  /** Will add a ⚠️ to the message and change the color to config.colors.error */
  isError?: boolean;
};

export async function replyWithEmbed(
  interaction: APIApplicationCommandInteraction,
  api: API,
  messages: Array<string>,
  options?: ReplyWithEmbedOptions,
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

  await api.interactions.reply(interaction.id, interaction.token, {
    components: [
      {
        type: ComponentType.Container,
        accent_color: options?.isError ? config.colors.error : config.colors.default,
        components,
      },
    ],
    flags: MessageFlags.IsComponentsV2 | (options?.ephemeral ? MessageFlags.Ephemeral : 0),
  });
}
