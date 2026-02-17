import { describe, expect, test } from "vitest";
import { ConfigSchema, RepoSchema } from "../config.schema";

describe("RepoSchema", () => {
  test("validates valid repo", () => {
    const result = RepoSchema.safeParse({
      name: "my-repo",
      path: "/path/to/repo",
    });
    expect(result.success).toBe(true);
  });

  test("validates repo with optional mainBranch", () => {
    const result = RepoSchema.safeParse({
      name: "my-repo",
      path: "/path/to/repo",
      mainBranch: "develop",
    });
    expect(result.success).toBe(true);
  });

  test("rejects missing name", () => {
    const result = RepoSchema.safeParse({ path: "/path" });
    expect(result.success).toBe(false);
  });

  test("rejects missing path", () => {
    const result = RepoSchema.safeParse({ name: "repo" });
    expect(result.success).toBe(false);
  });

  test("rejects extra properties (strict mode)", () => {
    const result = RepoSchema.safeParse({
      name: "repo",
      path: "/path",
      extra: "field",
    });
    expect(result.success).toBe(false);
  });
});

describe("ConfigSchema", () => {
  const validConfig = {
    authorEmails: ["test@example.com"],
    repos: [{ name: "repo1", path: "/path" }],
  };

  test("validates minimal valid config", () => {
    const result = ConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sprintLength).toBe(2);
      expect(result.data.groupBy).toBe("repo");
      expect(result.data.locale).toBe("en-US");
      expect(result.data.mainBranch).toBe("main");
      expect(result.data.branchStrategy).toBe("all");
    }
  });

  test("accepts valid emails", () => {
    const emails = [
      "user@example.com",
      "user+tag@domain.co.uk",
      "name.surname@company.org",
    ];
    const result = ConfigSchema.safeParse({
      ...validConfig,
      authorEmails: emails,
    });
    expect(result.success).toBe(true);
  });

  test("rejects invalid email formats", () => {
    const invalidEmails = ["not-an-email", "test@", "@example.com"];
    for (const email of invalidEmails) {
      const result = ConfigSchema.safeParse({
        ...validConfig,
        authorEmails: [email],
      });
      expect(result.success).toBe(false);
    }
  });

  test("accepts valid locales", () => {
    const locales = ["en-US", "it-IT", "fr-FR", "de-DE", "ja-JP"];
    for (const locale of locales) {
      const result = ConfigSchema.safeParse({ ...validConfig, locale });
      expect(result.success).toBe(true);
    }
  });

  test("rejects invalid locales", () => {
    const result = ConfigSchema.safeParse({
      ...validConfig,
      locale: "not_a_valid_locale!@#",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Invalid locale format");
    }
  });

  test("accepts positive integers for sprintLength", () => {
    const result = ConfigSchema.safeParse({ ...validConfig, sprintLength: 5 });
    expect(result.success).toBe(true);
  });

  test("rejects zero sprintLength", () => {
    const result = ConfigSchema.safeParse({ ...validConfig, sprintLength: 0 });
    expect(result.success).toBe(false);
  });

  test("rejects negative sprintLength", () => {
    const result = ConfigSchema.safeParse({ ...validConfig, sprintLength: -1 });
    expect(result.success).toBe(false);
  });

  test("rejects non-integer sprintLength", () => {
    const result = ConfigSchema.safeParse({ ...validConfig, sprintLength: 1.5 });
    expect(result.success).toBe(false);
  });

  test("accepts valid groupBy values", () => {
    const values: Array<"repo" | "category"> = ["repo", "category"];
    for (const groupBy of values) {
      const result = ConfigSchema.safeParse({ ...validConfig, groupBy });
      expect(result.success).toBe(true);
    }
  });

  test("rejects invalid groupBy values", () => {
    const result = ConfigSchema.safeParse({ ...validConfig, groupBy: "invalid" });
    expect(result.success).toBe(false);
  });

  test("accepts valid branchStrategy values", () => {
    const values: Array<"all" | "remote"> = ["all", "remote"];
    for (const branchStrategy of values) {
      const result = ConfigSchema.safeParse({ ...validConfig, branchStrategy });
      expect(result.success).toBe(true);
    }
  });

  test("rejects invalid branchStrategy values", () => {
    const result = ConfigSchema.safeParse({
      ...validConfig,
      branchStrategy: "local",
    });
    expect(result.success).toBe(false);
  });

  test("rejects missing authorEmails", () => {
    const result = ConfigSchema.safeParse({ repos: validConfig.repos });
    expect(result.success).toBe(false);
  });

  test("rejects missing repos", () => {
    const result = ConfigSchema.safeParse({
      authorEmails: validConfig.authorEmails,
    });
    expect(result.success).toBe(false);
  });

  test("rejects extra properties (strict mode)", () => {
    const result = ConfigSchema.safeParse({
      ...validConfig,
      extraField: "value",
    });
    expect(result.success).toBe(false);
  });

  test("handles empty repos array", () => {
    const result = ConfigSchema.safeParse({
      authorEmails: ["test@example.com"],
      repos: [],
    });
    expect(result.success).toBe(true);
  });

  test("handles multiple repos", () => {
    const result = ConfigSchema.safeParse({
      authorEmails: ["test@example.com"],
      repos: [
        { name: "repo1", path: "/path1" },
        { name: "repo2", path: "/path2" },
      ],
    });
    expect(result.success).toBe(true);
  });
});
