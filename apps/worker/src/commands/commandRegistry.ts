import { Routes, type RESTPostAPIChatInputApplicationCommandsJSONBody } from "@discordjs/core";
import { env, rest } from "@kuudrabot/shared";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { logger } from "../utils/logger.js";
import type { Command } from "./types.js";

const commands = new Map<string, Command>();

const COMMAND_FILE_REGEX = /\.(js|mjs|cjs|ts)$/i;
const _filename = fileURLToPath(import.meta.url);

/** Register all commands in this directory and its subdirectories. */
export async function registerCommands() {
  for (const { command } of await discoverCommands(path.dirname(_filename))) {
    commands.set(command.name, command);
  }
  logger.info(`Registered ${commands.size} command${commands.size == 1 ? "" : "s"}.`);
}

/** Get command by name. */
export function getCommand(name: string): Command | undefined {
  return commands.get(name);
}

/** Get all commands. */
export function getAllCommands(): Command[] {
  return Array.from(commands.values());
}

/** Scan this directory and all subdirectories for valid command objects. */
async function discoverCommands(commandsDir: string) {
  const loaded = new Array<{ filePath: string; command: Command }>();

  for (const filePath of await walk(commandsDir)) {
    const command = await getCommandFromFile(filePath);

    if (!command) continue;

    logger.info(
      {
        commandName: command.name,
        filePath,
      },
      "Discovered a command.",
    );

    loaded.push({ filePath, command });
  }

  return loaded;
}

/** Send command data to discord (mainly name + description + option fields). */
export async function deployCommands() {
  const globalCommandsData = new Array<RESTPostAPIChatInputApplicationCommandsJSONBody>();
  const guildCommandsData = new Map<string, RESTPostAPIChatInputApplicationCommandsJSONBody[]>();

  for (const command of getAllCommands()) {
    // Copy local command.name and command.description to Discord payload.
    const discordPayload: RESTPostAPIChatInputApplicationCommandsJSONBody = {
      ...command.data,
      name: command.name,
      description: command.description,
    };

    // Group the payloads by their destination.
    if (command.guildId) {
      if (!guildCommandsData.has(command.guildId)) {
        guildCommandsData.set(command.guildId, []);
      }
      guildCommandsData.get(command.guildId)!.push(discordPayload);
    } else {
      globalCommandsData.push(discordPayload);
    }
  }

  try {
    const deploys = new Array<Promise<unknown>>();

    if (globalCommandsData.length > 0) {
      logger.info(`Deploying ${globalCommandsData.length} commands globally...`);
      deploys.push(
        rest.put(Routes.applicationCommands(env.DISCORD_APPLICATION_ID), {
          body: globalCommandsData,
        }),
      );
    }

    for (const [guildId, commandsData] of guildCommandsData.entries()) {
      logger.info(`Deploying ${commandsData.length} commands to guild ${guildId}...`);
      deploys.push(
        rest.put(Routes.applicationGuildCommands(env.DISCORD_APPLICATION_ID, guildId), {
          body: commandsData,
        }),
      );
    }

    await Promise.all(deploys);

    logger.info("Successfully deployed all commands.");
  } catch (error) {
    logger.error(error as Error, "Failed to deploy commands.");
  }
}

/**
 * Dynamically import a file and check for a valid command object.
 * @returns The command or null.
 */
async function getCommandFromFile(path: string) {
  const mod = await import(pathToFileURL(path).href);
  const candidate =
    (mod.default as Command | undefined) ??
    (mod.command as Command | undefined) ??
    (mod as Command);

  if (!candidate || typeof candidate !== "object") return null;
  if (!("data" in candidate) || !("execute" in candidate)) return null;

  return candidate;
}

/** Returns all files a directory, recursively. */
async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(fullPath);
      if (entry.isFile() && COMMAND_FILE_REGEX.test(entry.name)) {
        return [fullPath];
      }
      return [];
    }),
  );

  return results.flat();
}
