import { describe, expect, test } from "vitest";
import { ZodError, z } from "zod";
import { formatValidationErrors } from "../read-json-file";

describe("formatValidationErrors", () => {
  test("formats single error at root level", () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({ name: 123 });

    if (!result.success) {
      const formatted = formatValidationErrors(result.error);

      expect(formatted).toHaveLength(1);
      expect(formatted[0]).toContain("expected string");
      expect(formatted[0]).toContain('"name"');
    }
  });

  test("formats nested path errors", () => {
    const schema = z.object({
      repos: z.array(
        z.object({
          name: z.string(),
          path: z.string(),
        }),
      ),
    });
    const result = schema.safeParse({
      repos: [{ name: "test", path: 123 }],
    });

    if (!result.success) {
      const formatted = formatValidationErrors(result.error);

      expect(formatted).toHaveLength(1);
      expect(formatted[0]).toContain('"repos.0.path"');
    }
  });

  test("formats multiple errors", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      email: z.email(),
    });
    const result = schema.safeParse({
      name: 123,
      age: "not a number",
      email: "invalid",
    });

    if (!result.success) {
      const formatted = formatValidationErrors(result.error);

      expect(formatted.length).toBeGreaterThanOrEqual(3);
      expect(formatted.some(line => line.includes('"name"'))).toBe(true);
      expect(formatted.some(line => line.includes('"age"'))).toBe(true);
      expect(formatted.some(line => line.includes('"email"'))).toBe(true);
    }
  });

  test("formats error without path", () => {
    const error = new ZodError([
      {
        code: "custom",
        message: "Custom validation error",
        path: [],
      },
    ]);

    const formatted = formatValidationErrors(error);

    expect(formatted).toHaveLength(1);
    expect(formatted[0]).toBe("  • Custom validation error");
    expect(formatted[0]).not.toContain('at ""');
  });

  test("handles empty issues array", () => {
    const error = new ZodError([]);
    const formatted = formatValidationErrors(error);

    expect(formatted).toEqual([]);
  });

  test("formats all errors with bullet points", () => {
    const schema = z.object({
      name: z.string(),
      value: z.number(),
    });
    const result = schema.safeParse({ name: 123, value: "text" });

    if (!result.success) {
      const formatted = formatValidationErrors(result.error);

      for (const line of formatted) {
        expect(line).toMatch(/^\s+•/);
      }
    }
  });
});
