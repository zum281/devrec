import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";
import type { ZodError } from "zod";
import { setupConsoleSpy, setupProcessExitSpy } from "@/utils/__tests__/fixtures";
import { handleJsonFileError } from "../handle-json-file-error";

vi.mock("../read-json-file", () => ({
  formatValidationErrors: vi.fn((error: ZodError) =>
    error.issues.map(issue => `  • ${issue.message}`),
  ),
}));

describe("handleJsonFileError", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = setupConsoleSpy("error");
    processExitSpy = setupProcessExitSpy();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("handles Zod validation error", () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({ name: 123 });

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    const error = new Error("Test validation failed");
    error.cause = result.error;

    handleJsonFileError(error, "TestContext");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Test validation failed:"),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("•"));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test("handles JSON parse error with cause", () => {
    const parseError = new Error("Failed to parse Config as JSON");
    parseError.cause = new Error("Unexpected token");

    handleJsonFileError(parseError, "Config");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to parse Config as JSON"),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unexpected token"),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test("handles JSON parse error without cause", () => {
    const parseError = new Error("Failed to parse data");

    handleJsonFileError(parseError, "Data");

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to parse data");
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test("handles generic error", () => {
    const genericError = new Error("Something went wrong");

    handleJsonFileError(genericError, "Config");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error reading Config: Error: Something went wrong",
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test("handles non-Error objects", () => {
    const stringError = "String error";

    handleJsonFileError(stringError, "Package.json");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error reading Package.json: String error",
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test("handles null error", () => {
    handleJsonFileError(null, "Config");

    expect(consoleErrorSpy).toHaveBeenCalledWith("Error reading Config: null");
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
