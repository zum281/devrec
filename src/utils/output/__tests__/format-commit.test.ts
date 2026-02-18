import { describe, it, expect } from "vitest";
import type { CommitEntry } from "@/types";
import { formatCommitLine } from "../format-commit";

const createCommit = (overrides: Partial<CommitEntry> = {}): CommitEntry => ({
  hash: "abcdef123456",
  message: "test: commit message",
  date: "2024-01-15T10:30:00Z",
  repoName: "test-repo",
  ...overrides,
});

describe("format-commit", () => {
  describe("formatCommitLine - markdown format", () => {
    it("should format markdown commit without branches", () => {
      const commit = createCommit();
      const result = formatCommitLine(commit, {
        format: "markdown",
        locale: "en-US",
        showBranches: false,
        isColorsEnabled: false,
      });

      expect(result).toContain("- [abcdef1] test: commit message");
      expect(result).toMatch(/_\(.*Jan.*2024.*\)_/);
      expect(result).toMatch(/\n$/);
    });

    it("should format markdown commit with branches", () => {
      const commit = createCommit({ branch: "feat/my-feature" });
      const result = formatCommitLine(commit, {
        format: "markdown",
        locale: "en-US",
        showBranches: true,
        isColorsEnabled: false,
      });

      expect(result).toContain("- [abcdef1] test: commit message");
      expect(result).toContain("`[feat/my-feature]`");
      expect(result).toMatch(/_\(.*Jan.*2024.*\)_/);
      expect(result).toMatch(/\n$/);
    });

    it("should not show branch when showBranches is false", () => {
      const commit = createCommit({ branch: "feat/my-feature" });
      const result = formatCommitLine(commit, {
        format: "markdown",
        locale: "en-US",
        showBranches: false,
        isColorsEnabled: false,
      });

      expect(result).not.toContain("feat/my-feature");
    });

    it("should handle commit without branch field", () => {
      const commit = createCommit();
      const result = formatCommitLine(commit, {
        format: "markdown",
        locale: "en-US",
        showBranches: true,
        isColorsEnabled: false,
      });

      expect(result).toContain("\u2713 [abcdef1] test: commit message");
      expect(result).not.toContain("`[");
      expect(result).toMatch(/_\(.*Jan.*2024.*\)_/);
    });

    it("should format date with different locale", () => {
      const commit = createCommit();
      const result = formatCommitLine(commit, {
        format: "markdown",
        locale: "fr-FR",
        showBranches: false,
        isColorsEnabled: false,
      });

      expect(result).toContain("15 janv. 2024");
    });
  });

  describe("formatCommitLine - plain format", () => {
    it("should format plain commit without colors and without branches", () => {
      const commit = createCommit();
      const result = formatCommitLine(commit, {
        format: "plain",
        locale: "en-US",
        showBranches: false,
        isColorsEnabled: false,
      });

      expect(result).toContain("- [abcdef1] test: commit message");
      expect(result).toMatch(/\(.*Jan.*2024.*\)/);
      expect(result).toMatch(/\n$/);
    });

    it("should format plain commit with colors and without branches", () => {
      const commit = createCommit();
      const result = formatCommitLine(commit, {
        format: "plain",
        locale: "en-US",
        showBranches: false,
        isColorsEnabled: true,
      });

      // Check basic structure (colors may not work in test environment)
      expect(result).toContain("[abcdef1]");
      expect(result).toContain("test: commit message");
      expect(result).toMatch(/\(.*Jan.*2024.*\)/);
      expect(result).toMatch(/\n$/);
    });

    it("should format plain commit with colors and branches", () => {
      const commit = createCommit({ branch: "feat/my-feature" });
      const result = formatCommitLine(commit, {
        format: "plain",
        locale: "en-US",
        showBranches: true,
        isColorsEnabled: true,
      });

      expect(result).toContain("[abcdef1]");
      expect(result).toContain("test: commit message");
      expect(result).toContain("[feat/my-feature]");
      expect(result).toMatch(/\(.*Jan.*2024.*\)/);
    });

    it("should format plain commit without colors but with branches", () => {
      const commit = createCommit({ branch: "feat/my-feature" });
      const result = formatCommitLine(commit, {
        format: "plain",
        locale: "en-US",
        showBranches: true,
        isColorsEnabled: false,
      });

      expect(result).toContain(
        "- [abcdef1] test: commit message [feat/my-feature]",
      );
      expect(result).toMatch(/\(.*Jan.*2024.*\)/);
    });

    it("should not show branch when showBranches is false", () => {
      const commit = createCommit({ branch: "feat/my-feature" });
      const result = formatCommitLine(commit, {
        format: "plain",
        locale: "en-US",
        showBranches: false,
        isColorsEnabled: false,
      });

      expect(result).not.toContain("feat/my-feature");
    });

    it("should format date with different locale", () => {
      const commit = createCommit();
      const result = formatCommitLine(commit, {
        format: "plain",
        locale: "de-DE",
        showBranches: false,
        isColorsEnabled: false,
      });

      expect(result).toContain("15. Jan. 2024");
    });
  });

  describe("hash slicing", () => {
    it("should slice hash to 7 characters", () => {
      const commit = createCommit({ hash: "1234567890abcdef" });
      const result = formatCommitLine(commit, {
        format: "plain",
        locale: "en-US",
        showBranches: false,
        isColorsEnabled: false,
      });

      expect(result).toContain("[1234567]");
      expect(result).not.toContain("1234567890abcdef");
    });
  });

  describe("special characters", () => {
    it("should handle special characters in commit message", () => {
      const commit = createCommit({
        message: 'test: fix "quotes" & <tags>',
      });
      const result = formatCommitLine(commit, {
        format: "markdown",
        locale: "en-US",
        showBranches: false,
        isColorsEnabled: false,
      });

      expect(result).toContain('test: fix "quotes" & <tags>');
    });

    it("should handle Unicode in commit message", () => {
      const commit = createCommit({
        message: "feat: add emoji support 🎉",
      });
      const result = formatCommitLine(commit, {
        format: "markdown",
        locale: "en-US",
        showBranches: false,
        isColorsEnabled: false,
      });

      expect(result).toContain("feat: add emoji support 🎉");
    });

    it("should handle special characters in branch name", () => {
      const commit = createCommit({
        branch: "feat/IT-123_my-feature",
      });
      const result = formatCommitLine(commit, {
        format: "markdown",
        locale: "en-US",
        showBranches: true,
        isColorsEnabled: false,
      });

      expect(result).toContain("`[feat/IT-123_my-feature]`");
    });
  });

  describe("very long commit messages", () => {
    it("should handle very long commit messages", () => {
      const longMessage = "a".repeat(1500);
      const commit = createCommit({ message: longMessage });
      const result = formatCommitLine(commit, {
        format: "plain",
        locale: "en-US",
        showBranches: false,
        isColorsEnabled: false,
      });

      expect(result).toContain(longMessage);
      expect(result.length).toBeGreaterThan(1500);
    });
  });

  describe("empty branch handling", () => {
    it("should handle empty string branch as merged (shows checkmark)", () => {
      const commit = createCommit({ branch: "" });
      const result = formatCommitLine(commit, {
        format: "markdown",
        locale: "en-US",
        showBranches: true,
        isColorsEnabled: false,
      });

      expect(result).not.toContain("``");
      expect(result).toContain("\u2713 [abcdef1] test: commit message");
      expect(result).toMatch(/_\(.*Jan.*2024.*\)_/);
    });

    it("should handle undefined branch", () => {
      const commit = createCommit();
      delete commit.branch;
      const result = formatCommitLine(commit, {
        format: "plain",
        locale: "en-US",
        showBranches: true,
        isColorsEnabled: false,
      });

      expect(result).toContain("\u2713 [abcdef1] test: commit message");
      expect(result).toMatch(/\(.*Jan.*2024.*\)/);
    });
  });

  describe("merged commit checkmark", () => {
    it("should show checkmark for merged commit in markdown when showBranches is true", () => {
      const commit = createCommit();
      const result = formatCommitLine(commit, {
        format: "markdown",
        locale: "en-US",
        showBranches: true,
        isColorsEnabled: false,
      });

      expect(result).toMatch(/^\s+- \u2713 \[abcdef1]/);
    });

    it("should not show checkmark when showBranches is false", () => {
      const commit = createCommit();
      const result = formatCommitLine(commit, {
        format: "markdown",
        locale: "en-US",
        showBranches: false,
        isColorsEnabled: false,
      });

      expect(result).not.toContain("\u2713");
    });

    it("should not show checkmark for unmerged commit with branch", () => {
      const commit = createCommit({ branch: "feat/my-branch" });
      const result = formatCommitLine(commit, {
        format: "plain",
        locale: "en-US",
        showBranches: true,
        isColorsEnabled: false,
      });

      expect(result).not.toContain("\u2713");
    });

    it("should show checkmark in plain text without colors", () => {
      const commit = createCommit();
      const result = formatCommitLine(commit, {
        format: "plain",
        locale: "en-US",
        showBranches: true,
        isColorsEnabled: false,
      });

      expect(result).toMatch(/^\s+- \u2713 \[abcdef1]/);
    });
  });
});
