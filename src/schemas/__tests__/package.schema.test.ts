import { describe, expect, test } from "vitest";
import { PackageInfoSchema } from "../package.schema";

describe("PackageInfoSchema", () => {
  test("validates complete package info", () => {
    const result = PackageInfoSchema.safeParse({
      name: "devrec",
      version: "1.0.0",
      description: "A developer log tool",
    });
    expect(result.success).toBe(true);
  });

  test("rejects missing name", () => {
    const result = PackageInfoSchema.safeParse({
      version: "1.0.0",
      description: "Description",
    });
    expect(result.success).toBe(false);
  });

  test("rejects missing version", () => {
    const result = PackageInfoSchema.safeParse({
      name: "devrec",
      description: "Description",
    });
    expect(result.success).toBe(false);
  });

  test("rejects missing description", () => {
    const result = PackageInfoSchema.safeParse({
      name: "devrec",
      version: "1.0.0",
    });
    expect(result.success).toBe(false);
  });

  test("rejects invalid types", () => {
    const result = PackageInfoSchema.safeParse({
      name: 123,
      version: "1.0.0",
      description: "Description",
    });
    expect(result.success).toBe(false);
  });
});
