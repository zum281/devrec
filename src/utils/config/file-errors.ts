/**
 * Type guard for Node.js file system errors
 * @param error - Error to check
 * @returns True if error is a NodeJS.ErrnoException
 */
export const isNodeError = (error: unknown): error is NodeJS.ErrnoException => {
  return error instanceof Error && "code" in error;
};

/**
 * Checks if error is ENOENT (file not found)
 * @param error - Error to check
 * @returns True if error is file not found
 */
export const isFileNotFound = (error: unknown): boolean => {
  return isNodeError(error) && error.code === "ENOENT";
};

/**
 * Checks if error is EACCES (permission denied)
 * @param error - Error to check
 * @returns True if error is permission denied
 */
export const isPermissionDenied = (error: unknown): boolean => {
  return isNodeError(error) && error.code === "EACCES";
};
