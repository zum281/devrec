import { readFile } from "node:fs/promises";
import type { z } from "zod";

/**
 * Reads and validates a JSON file with Zod schema
 * @param filePath - Path to JSON file
 * @param schema - Zod schema for validation
 * @param errorContext - Context string for error messages (e.g., "Config", "package.json")
 * @returns Validated data
 * @throws Error when file cannot be read, parsed, or validated
 */
export const readJsonFile = async <T>(
  filePath: string,
  schema: z.ZodType<T>,
  errorContext: string,
): Promise<T> => {
  // Read file - let file system errors propagate
  const data = await readFile(filePath, "utf8");

  // Parse JSON
  let parsedData: unknown;
  try {
    parsedData = JSON.parse(data);
  } catch (error) {
    const parseError = new Error(`Failed to parse ${errorContext} as JSON`);
    parseError.cause = error;
    throw parseError;
  }

  // Validate with schema
  const result = schema.safeParse(parsedData);
  if (!result.success) {
    const validationError = new Error(`${errorContext} validation failed`);
    validationError.cause = result.error;
    throw validationError;
  }

  return result.data;
};

/**
 * Formats Zod validation errors for console output
 * @param error - Zod error with issues
 * @returns Array of formatted error messages
 */
export const formatValidationErrors = (error: z.ZodError): Array<string> => {
  return error.issues.map(issue => {
    const path = issue.path.length > 0 ? ` at "${issue.path.join(".")}"` : "";
    return `  • ${issue.message}${path}`;
  });
};
