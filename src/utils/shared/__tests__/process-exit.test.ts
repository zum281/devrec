import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exitWithError, handleCommandError } from "../process-exit";

describe("process-exit", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      /* noop */
    });
    processExitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      /* noop */
    }) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("exitWithError", () => {
    it("should log error message and exit with code 1 by default", () => {
      exitWithError("Test error");

      expect(consoleErrorSpy).toHaveBeenCalledWith("Test error");
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should exit with custom exit code", () => {
      exitWithError("Test error", 2);

      expect(consoleErrorSpy).toHaveBeenCalledWith("Test error");
      expect(processExitSpy).toHaveBeenCalledWith(2);
    });

    it("should handle multiline messages", () => {
      const message = "Error line 1\nError line 2";
      exitWithError(message);

      expect(consoleErrorSpy).toHaveBeenCalledWith(message);
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should handle empty message", () => {
      exitWithError("");

      expect(consoleErrorSpy).toHaveBeenCalledWith("");
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe("handleCommandError", () => {
    it("should handle Error instance without context", () => {
      const error = new Error("Command failed");
      handleCommandError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith("Command failed");
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should handle Error instance with context", () => {
      const error = new Error("Command failed");
      handleCommandError(error, "Failed to fetch commits");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to fetch commits:",
        "Command failed",
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should handle unknown error without context", () => {
      handleCommandError("string error");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "An unexpected error occurred",
        "string error",
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should handle unknown error with context", () => {
      handleCommandError({ code: 123 }, "Database operation");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Database operation: An unexpected error occurred",
        { code: 123 },
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should handle null error with context", () => {
      handleCommandError(null, "Null error");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Null error: An unexpected error occurred",
        null,
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should handle undefined error", () => {
      const error = undefined;
      handleCommandError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "An unexpected error occurred",
        undefined,
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
