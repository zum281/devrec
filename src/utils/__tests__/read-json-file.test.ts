import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";
import { readJsonFile } from "../read-json-file";

vi.mock("node:fs/promises");

describe("readJsonFile", () => {
  const TestSchema = z.object({
    name: z.string(),
    value: z.number(),
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("reads and validates valid JSON file", async () => {
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({ name: "test", value: 42 }),
    );

    const result = await readJsonFile(
      "/path/to/file.json",
      TestSchema,
      "Test file",
    );

    expect(result).toEqual({ name: "test", value: 42 });
  });

  test("throws error when file cannot be read", async () => {
    vi.mocked(readFile).mockRejectedValue(new Error("File not found"));

    await expect(
      readJsonFile("/path/to/missing.json", TestSchema, "Test file"),
    ).rejects.toThrow("File not found");
  });

  test("throws error when JSON is invalid", async () => {
    vi.mocked(readFile).mockResolvedValue("{invalid json}");

    await expect(
      readJsonFile("/path/to/file.json", TestSchema, "Test file"),
    ).rejects.toThrow("Failed to parse Test file as JSON");
  });

  test("throws error when validation fails", async () => {
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({ name: "test", value: "not-a-number" }),
    );

    await expect(
      readJsonFile("/path/to/file.json", TestSchema, "Test file"),
    ).rejects.toThrow("Test file validation failed");
  });

  test("throws validation error with cause containing path", async () => {
    const NestedSchema = z.object({
      nested: z.object({
        value: z.number(),
      }),
    });

    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({ nested: { value: "not-a-number" } }),
    );

    try {
      await readJsonFile("/path/to/file.json", NestedSchema, "Test file");
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toBe("Test file validation failed");
        expect(error.cause).toBeDefined();
      }
    }
  });
});
