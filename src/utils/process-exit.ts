/**
 * Exits the process with an error message
 * @param message - Error message to display
 * @param exitCode - Exit code (default: 1)
 */
export const exitWithError = (message: string, exitCode = 1): never => {
  console.error(message);
  process.exit(exitCode);
};

/**
 * Handles CLI command errors with appropriate messaging
 * @param error - Error thrown during command execution
 * @param context - Optional context for error message
 */
export const handleCommandError = (error: unknown, context?: string): never => {
  if (error instanceof Error) {
    if (context) {
      console.error(`${context}:`, error.message);
    } else {
      console.error(error.message);
    }
  } else {
    const message = context
      ? `${context}: An unexpected error occurred`
      : "An unexpected error occurred";
    console.error(message, error);
  }

  process.exit(1);
};
