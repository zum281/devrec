import os from "node:os";
import { ConfigSchema } from "@/schemas/config.schema";
import type { Config } from "@/types";
import { isFileNotFound, isPermissionDenied } from "./file-errors";
import { handleJsonFileError } from "./handle-json-file-error";
import { exitWithError } from "./process-exit";
import { readJsonFile } from "./read-json-file";

/**
 * Reads and validates the devrec configuration file
 * @returns Validated configuration object
 * @throws Exits process if config file is missing or invalid
 */
export const readConfig = async (): Promise<Config> => {
  const home = os.homedir();
  const configPath = `${home}/.config/devrec/config.json`;

  try {
    return await readJsonFile(configPath, ConfigSchema, "Config");
  } catch (error) {
    // Handle file not found - most common first-run scenario
    if (isFileNotFound(error)) {
      exitWithError(
        `Config file not found at ${configPath}\n\nRun 'drec init' to create your config file interactively.`,
      );
    }

    // Handle permission denied
    if (isPermissionDenied(error)) {
      exitWithError(
        `Permission denied reading config at ${configPath}\nCheck file permissions and try again.`,
      );
    }

    // Handle all other errors (validation, parse, generic)
    return handleJsonFileError(error, "Config");
  }
};
