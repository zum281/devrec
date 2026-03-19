import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("simple-git");

describe("scanGlobalGitEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns email when global config is set", async () => {
    const { default: git } = await import("simple-git");

    vi.mocked(git).mockReturnValue({
      getConfig: vi.fn().mockResolvedValue({ value: "user@example.com" }),
    } as never);

    const { scanGlobalGitEmail } = await import("../git-email-scanner");
    const result = await scanGlobalGitEmail();

    expect(result).toBe("user@example.com");
    expect(git).toHaveBeenCalledWith();
  });

  test("returns null when global config value is undefined", async () => {
    const { default: git } = await import("simple-git");

    vi.mocked(git).mockReturnValue({
      getConfig: vi.fn().mockResolvedValue({ value: undefined }),
    } as never);

    const { scanGlobalGitEmail } = await import("../git-email-scanner");
    const result = await scanGlobalGitEmail();

    expect(result).toBeNull();
  });

  test("returns null on error", async () => {
    const { default: git } = await import("simple-git");

    vi.mocked(git).mockReturnValue({
      getConfig: vi.fn().mockRejectedValue(new Error("git not found")),
    } as never);

    const { scanGlobalGitEmail } = await import("../git-email-scanner");
    const result = await scanGlobalGitEmail();

    expect(result).toBeNull();
  });
});
