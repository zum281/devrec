import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { setupConsoleSpy, setupProcessExitSpy } from "@/utils/__tests__/fixtures";

vi.mock("node:fs/promises");

describe("readPackageInfo", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
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
