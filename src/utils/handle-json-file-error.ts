import { ZodError } from "zod";
import { exitWithError } from "./process-exit";
import { formatValidationErrors } from "./read-json-file";

/**
 * Handles common JSON file errors (validation, parse, generic)
 * @param error - Error thrown during JSON file operations
 * @param context - Context string for error messages (e.g., "Config", "Package.json")
 */
export const handleJsonFileError = (error: unknown, context: string): never => {
  // Handle validation errors
  if (error instanceof Error && error.cause instanceof ZodError) {
    const validationErrors = formatValidationErrors(error.cause).join("\n");
    return exitWithError(`${error.message}:\n${validationErrors}`);
  }

  // Handle parse errors
  if (error instanceof Error && error.message.includes("parse")) {
    const causeMessage =
      error.cause instanceof Error ? `\n${error.cause.message}` : "";
    return exitWithError(`${error.message}${causeMessage}`);
  }

  // Generic error
  return exitWithError(`Error reading ${context}: ${String(error)}`);
};
