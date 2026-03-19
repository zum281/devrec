import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { setupConsoleSpy, setupProcessExitSpy } from "@/utils/shared/__tests__/fixtures";
import { findPackageJson } from "../read-package";

vi.mock("node:fs");
vi.mock("node:fs/promises");

describe("findPackageJson", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("returns path when package.json is in the start directory", () => {
    vi.mocked(existsSync).mockReturnValueOnce(true);

    const result = findPackageJson("/some/dir");

    expect(result).toBe("/some/dir/package.json");
  });

  test("walks up to find package.json in a parent directory", () => {
    vi.mocked(existsSync)
      .mockReturnValueOnce(false) // /some/dir/package.json — not found
      .mockReturnValueOnce(true); // /some/package.json — found

    const result = findPackageJson("/some/dir");

    expect(result).toBe("/some/package.json");
  });

  test("walks multiple levels up to find package.json", () => {
    vi.mocked(existsSync)
      .mockReturnValueOnce(false) // /a/b/c/package.json
      .mockReturnValueOnce(false) // /a/b/package.json
      .mockReturnValueOnce(true); // /a/package.json

    const result = findPackageJson("/a/b/c");

    expect(result).toBe("/a/package.json");
  });

  test("throws when package.json is not found up to filesystem root", () => {
    vi.mocked(existsSync).mockReturnValue(false);

    expect(() => findPackageJson("/a/b")).toThrow("Could not find package.json");
  });
});

describe("readPackageInfo", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // findPackageJson walks up from import.meta.url — mock existsSync so it
    // resolves immediately and readFile (mocked below) controls the outcome.
    vi.mocked(existsSync).mockReturnValue(true);
    consoleErrorSpy = setupConsoleSpy("error");
    processExitSpy = setupProcessExitSpy();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("reads and validates package.json", async () => {
    const mockPackage = {
      name: "devrec",
      version: "1.0.0",
      description: "A CLI tool",
    };

    vi.mocked(readFile).mockResolvedValue(JSON.stringify(mockPackage));

    const { readPackageInfo } = await import("../read-package");
    const result = await readPackageInfo();

    expect(result).toEqual(mockPackage);
  });

  test("exits on missing package.json", async () => {
    vi.mocked(readFile).mockRejectedValue(new Error("ENOENT"));

    const { readPackageInfo } = await import("../read-package");
    await readPackageInfo();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error reading Package.json:"),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test("exits on invalid JSON", async () => {
    vi.mocked(readFile).mockResolvedValue("invalid json");

    const { readPackageInfo } = await import("../read-package");
    await readPackageInfo();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to parse Package.json as JSON"),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test("exits on schema validation failure", async () => {
    const invalidPackage = {
      name: "devrec",
    };

    vi.mocked(readFile).mockResolvedValue(JSON.stringify(invalidPackage));

    const { readPackageInfo } = await import("../read-package");
    await readPackageInfo();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Package.json validation failed:"),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
