import type { SimpleGit } from "simple-git";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("simple-git");

describe("getGitLog", () => {
  let mockLog: ReturnType<typeof vi.fn>;
  let mockGit: SimpleGit;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockLog = vi.fn();
    mockGit = {
      log: mockLog,
    } as unknown as SimpleGit;

    const simpleGit = await import("simple-git");
    vi.mocked(simpleGit.default).mockReturnValue(mockGit);

    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("fetches all commits when no dateRange provided", async () => {
    mockLog.mockResolvedValue({
      all: [
        {
          hash: "abc123",
          date: "2024-03-15T10:00:00Z",
          message: "feat: new feature",
        },
      ],
    });

    const { getGitLog } = await import("../git-log");

    const result = await getGitLog(["test@example.com"], "/path/to/repo");

    expect(mockLog).toHaveBeenCalledWith({
      "--author": ["test@example.com"],
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      hash: "abc123",
      date: "2024-03-15T10:00:00Z",
      message: "feat: new feature",
    });
  });

  test("fetches git log with custom date range", async () => {
    mockLog.mockResolvedValue({
      all: [
        {
          hash: "def456",
          date: "2024-03-16T10:00:00Z",
          message: "fix: bug fix",
        },
      ],
    });

    const { getGitLog } = await import("../git-log");

    await getGitLog(["test@example.com"], "/path/to/repo", {
      since: "Mon Mar 11 2024",
      until: "Fri Mar 15 2024",
    });

    expect(mockLog).toHaveBeenCalledWith({
      "--since": "Mon Mar 11 2024 00:00:00",
      "--until": "Fri Mar 15 2024 23:59:59",
      "--author": ["test@example.com"],
    });
  });

  test("expands tilde in repo path", async () => {
    mockLog.mockResolvedValue({ all: [] });

    const simpleGit = await import("simple-git");
    const mockGitConstructor = vi.mocked(simpleGit.default);

    const { getGitLog } = await import("../git-log");
    await getGitLog(["test@example.com"], "~/repos/project");

    const calledPath = mockGitConstructor.mock.calls[0][0];
    expect(calledPath).not.toContain("~");
    expect(calledPath).toContain("/repos/project");
  });

  test("throws error on git failure", async () => {
    mockLog.mockRejectedValue(new Error("Git error"));

    const { getGitLog } = await import("../git-log");

    await expect(getGitLog(["test@example.com"], "/path/to/repo")).rejects.toThrow(
      "Git error",
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching git log:",
      expect.any(Error),
    );
  });

  test("handles multiple authors", async () => {
    mockLog.mockResolvedValue({ all: [] });

    const { getGitLog } = await import("../git-log");

    await getGitLog(
      ["author1@example.com", "author2@example.com"],
      "/path/to/repo",
    );

    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({
        "--author": ["author1@example.com", "author2@example.com"],
      }),
    );
  });
});
