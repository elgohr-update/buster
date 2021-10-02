import type { CommandOptions } from "@sapphire/framework";
import { isURL } from "./utils";
import got from "got";
import fs from "fs";
import * as dotenv from "dotenv-cra";

// Enviroment
export interface Environment {
  development: boolean;
  botToken: string;
  prefix: string;
  config: string;

  logCommands: boolean;
  logMessages: boolean;

  httpAuthId: string;
  httpAuthSecret: string;
  httpFrontendUrl: string;
  httpPort: number;

  tenorToken?: string;
  perspectiveApiKey?: string;
  githubApiKey?: string;
}

// Configuration
export interface JSONConfiguration {
  owners: string[];
  listeners: string[];
  commands: Record<string, Command>;
}

// Command
interface Command {
  options: CommandOptions;
  vars: Record<string, any>;
}

export class BotConfiguration {
  env: Environment;

  // I'm sure using ! here is bad practice, but if config is null/undefined the both should crash
  // TODO: Need a better name than json
  json!: JSONConfiguration;

  public constructor() {
    // Set NODE_ENV to development if not already set
    process.env.NODE_ENV ??= "development";

    // Parse enviornment variables from .env
    // Note: .env.local and .env.development can be used as overrides
    // All enviornemnt variables related to the bot should be prefixed with `BUSTER_`
    dotenv.config({ prefix: "BUSTER_" });

    this.env = {
      botToken: process.env.BUSTER_BOT_TOKEN ?? "",
      config: process.env.BUSTER_BOT_CONFIG ?? "",
      development: process.env.NODE_ENV === "development",
      prefix: process.env.BUSTER_BOT_PREFIX ?? "!",

      logCommands: process.env.BUSTER_LOG_COMMANDS === "true",
      logMessages: process.env.BUSTER_LOG_MESSAGES === "true",

      httpAuthId: process.env.BUSTER_HTTP_AUTH_ID ?? "",
      httpAuthSecret: process.env.BUSTER_HTTP_AUTH_SECRET ?? "",
      httpFrontendUrl:
        process.env.BUSTER_HTTP_FRONTEND_URL ?? "http://localhost:4000",
      httpPort: parseInt(process.env.BUSTER_HTTP_PORT ?? "4000"),

      tenorToken: process.env.BUSTER_WEB_TENOR_TOKEN,
      perspectiveApiKey: process.env.BUSTER_WEB_PERSPECTIVE_API_KEY,
      githubApiKey: process.env.BUSTER_WEB_GITHUB_API_KEY,
    };

    if (!this.env.botToken || !this.env.config) {
      console.error("Missing bot token or config URL");
      process.exit(1);
    }
  }

  /**
   * Builds CommandOptions object by merging the specified options and
   * those found in the configuration file
   * @param commandName The name of the command
   * @param opts The default options for the command
   * @returns A merged CommandOptions object
   */
  public applyConfig(
    commandName: string,
    opts?: CommandOptions,
  ): CommandOptions {
    return {
      cooldownFilteredUsers: this.json.owners,
      ...opts,
      ...this.json.commands[commandName]?.options,
      name: commandName,
    };
  }

  /**
   * Build the Configuration object from the config file
   * Note: This is called automaticlly by loadEnvironment,
   * it should only be called again if the config file has changed.
   */
  public async load(): Promise<JSONConfiguration> {
    if (isURL(this.env.config)) {
      const response = await got.get(this.env.config);
      this.json = JSON.parse(response.body);
    } else {
      this.json = JSON.parse(fs.readFileSync(this.env.config).toString());
    }

    return this.json;
  }
}

// Creating an instance of config here to be accessed globally
export const config = new BotConfiguration();
