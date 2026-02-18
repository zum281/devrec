import { Command } from "commander";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { TieredCommits, TieredStats } from "@/types";

vi.mock("@/utils/read-config");
vi.mock("@/utils/commits");
vi.mock("@/utils/output/plain");
vi.mock("@/utils/output/markdown");
vi.mock("@/utils/process-exit");

const emptyTiered: TieredCommits = {
  keyContributions: { merged: {}, unmerged: {} },
  otherWork: { merged: {}, unmerged: {} },
};

const emptyStats: TieredStats = {
  totalCommits: 0,
  mergedCommits: 0,
  unmergedCommits: 0,
  repos: new Set(),
  keyContributionCount: 0,
};

const mockConfig = {
  authorEmails: ["test@example.com"],
  repos: [{ name: "repo1", path: "/path" }],
  sprintLength: 2,
  groupBy: "repo" as const,
  locale: "en-US",
  mainBranch: "main",
  branchStrategy: "all" as const,
};

describe("createTimeRangeCommand", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(vi.fn());
  });

  test("creates command with correct name and description", async () => {
    const { createTimeRangeCommand } = await import("../create-time-range-command");
    const getDateRange = vi.fn(() => ({
      since: "2024-01-01",
      until: "2024-01-07",
    }));

    const program = new Command();
    const register = createTimeRangeCommand("week", "Weekly commits", getDateRange);
    register(program);

    const weekCommand = program.commands.find(cmd => cmd.name() === "week");
    expect(weekCommand).toBeDefined();
    expect(weekCommand?.description()).toBe("Weekly commits");
  });

  test("executes plain format output by default", async () => {
    const { readConfig } = await import("@/utils/read-config");
    const {
      fetchAndCategorizeCommitsWithBranches,
      filterTieredCommits,
      calculateTieredStats,
    } = await import("@/utils/commits");
    const { generatePlainOutputWithBranches } =
      await import("@/utils/output/plain");

    vi.mocked(readConfig).mockResolvedValue(mockConfig);
    vi.mocked(fetchAndCategorizeCommitsWithBranches).mockResolvedValue({
      tiered: emptyTiered,
      stats: emptyStats,
    });
    vi.mocked(filterTieredCommits).mockReturnValue(emptyTiered);
    vi.mocked(calculateTieredStats).mockReturnValue(emptyStats);
    vi.mocked(generatePlainOutputWithBranches).mockReturnValue("plain output");

    const { createTimeRangeCommand } = await import("../create-time-range-command");
    const getDateRange = vi.fn(() => ({
      since: "2024-01-01",
      until: "2024-01-07",
    }));

    const program = new Command();
    const register = createTimeRangeCommand("test", "Test", getDateRange);
    register(program);

    await program.parseAsync(["node", "test", "test"]);

    expect(generatePlainOutputWithBranches).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith("plain output");
  });

  test("executes markdown format when specified", async () => {
    const { readConfig } = await import("@/utils/read-config");
    const {
      fetchAndCategorizeCommitsWithBranches,
      filterTieredCommits,
      calculateTieredStats,
    } = await import("@/utils/commits");
    const { generateMarkdownOutputWithBranches } =
      await import("@/utils/output/markdown");

    vi.mocked(readConfig).mockResolvedValue(mockConfig);
    vi.mocked(fetchAndCategorizeCommitsWithBranches).mockResolvedValue({
      tiered: emptyTiered,
      stats: emptyStats,
    });
    vi.mocked(filterTieredCommits).mockReturnValue(emptyTiered);
    vi.mocked(calculateTieredStats).mockReturnValue(emptyStats);
    vi.mocked(generateMarkdownOutputWithBranches).mockReturnValue("# Markdown");

    const { createTimeRangeCommand } = await import("../create-time-range-command");
    const getDateRange = vi.fn(() => ({
      since: "2024-01-01",
      until: "2024-01-07",
    }));

    const program = new Command();
    const register = createTimeRangeCommand("test", "Test", getDateRange);
    register(program);

    await program.parseAsync(["node", "test", "test", "--format", "markdown"]);

    expect(generateMarkdownOutputWithBranches).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith("# Markdown");
  });

  test("applies repo filter when specified", async () => {
    const { readConfig } = await import("@/utils/read-config");
    const {
      fetchAndCategorizeCommitsWithBranches,
      filterTieredCommits,
      calculateTieredStats,
    } = await import("@/utils/commits");
    const { generatePlainOutputWithBranches } =
      await import("@/utils/output/plain");

    vi.mocked(readConfig).mockResolvedValue(mockConfig);
    vi.mocked(fetchAndCategorizeCommitsWithBranches).mockResolvedValue({
      tiered: emptyTiered,
      stats: emptyStats,
    });
    vi.mocked(filterTieredCommits).mockReturnValue(emptyTiered);
    vi.mocked(calculateTieredStats).mockReturnValue(emptyStats);
    vi.mocked(generatePlainOutputWithBranches).mockReturnValue("output");

    const { createTimeRangeCommand } = await import("../create-time-range-command");
    const getDateRange = vi.fn(() => ({
      since: "2024-01-01",
      until: "2024-01-07",
    }));

    const program = new Command();
    const register = createTimeRangeCommand("test", "Test", getDateRange);
    register(program);

    await program.parseAsync(["node", "test", "test", "--repo", "my-repo"]);

    expect(filterTieredCommits).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ repo: "my-repo" }),
    );
  });

  test("applies category filter when specified", async () => {
    const { readConfig } = await import("@/utils/read-config");
    const {
      fetchAndCategorizeCommitsWithBranches,
      filterTieredCommits,
      calculateTieredStats,
    } = await import("@/utils/commits");
    const { generatePlainOutputWithBranches } =
      await import("@/utils/output/plain");

    vi.mocked(readConfig).mockResolvedValue(mockConfig);
    vi.mocked(fetchAndCategorizeCommitsWithBranches).mockResolvedValue({
      tiered: emptyTiered,
      stats: emptyStats,
    });
    vi.mocked(filterTieredCommits).mockReturnValue(emptyTiered);
    vi.mocked(calculateTieredStats).mockReturnValue(emptyStats);
    vi.mocked(generatePlainOutputWithBranches).mockReturnValue("output");

    const { createTimeRangeCommand } = await import("../create-time-range-command");
    const getDateRange = vi.fn(() => ({
      since: "2024-01-01",
      until: "2024-01-07",
    }));

    const program = new Command();
    const register = createTimeRangeCommand("test", "Test", getDateRange);
    register(program);

    await program.parseAsync(["node", "test", "test", "--category", "feature"]);

    expect(filterTieredCommits).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ category: "feature" }),
    );
  });

  test("sprint command passes sprint length to date range function", async () => {
    const { readConfig } = await import("@/utils/read-config");
    const {
      fetchAndCategorizeCommitsWithBranches,
      filterTieredCommits,
      calculateTieredStats,
    } = await import("@/utils/commits");
    const { generatePlainOutputWithBranches } =
      await import("@/utils/output/plain");

    vi.mocked(readConfig).mockResolvedValue({ ...mockConfig, sprintLength: 3 });
    vi.mocked(fetchAndCategorizeCommitsWithBranches).mockResolvedValue({
      tiered: emptyTiered,
      stats: emptyStats,
    });
    vi.mocked(filterTieredCommits).mockReturnValue(emptyTiered);
    vi.mocked(calculateTieredStats).mockReturnValue(emptyStats);
    vi.mocked(generatePlainOutputWithBranches).mockReturnValue("output");

    const { createTimeRangeCommand } = await import("../create-time-range-command");
    const getDateRange = vi.fn(() => ({
      since: "2024-01-01",
      until: "2024-01-21",
    }));

    const program = new Command();
    const register = createTimeRangeCommand("sprint", "Sprint", getDateRange);
    register(program);

    await program.parseAsync(["node", "test", "sprint"]);

    expect(getDateRange).toHaveBeenCalledWith(3);
  });

  test("handles error and calls handleCommandError", async () => {
    const { readConfig } = await import("@/utils/read-config");
    const { handleCommandError } = await import("@/utils/process-exit");

    const testError = new Error("Test error");
    vi.mocked(readConfig).mockRejectedValue(testError);

    const { createTimeRangeCommand } = await import("../create-time-range-command");
    const getDateRange = vi.fn(() => ({
      since: "2024-01-01",
      until: "2024-01-07",
    }));

    const program = new Command();
    const register = createTimeRangeCommand("test", "Test", getDateRange);
    register(program);

    await program.parseAsync(["node", "test", "test"]);

    expect(handleCommandError).toHaveBeenCalledWith(
      testError,
      "Failed to fetch test's commits",
    );
  });
});
