import os from "node:os";

/**
 * Expands tilde (~) in a file path to the user's home directory
 * @param filepath - Path that may contain tilde
 * @returns Expanded absolute path
 */
export const expandTilde = (filepath: string): string => {
  if (filepath.startsWith("~/") || filepath === "~") {
    return filepath.replace("~", os.homedir());
  }
  return filepath;
};
