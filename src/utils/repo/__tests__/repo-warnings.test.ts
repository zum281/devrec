import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logRepoValidationWarning } from "../repo-warnings";

describe("repo-warnings", () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      /* noop */
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("logRepoValidationWarning", () => {
    it("should log warning for not-found repo", () => {
      logRepoValidationWarning("myrepo", "/path/to/repo", {
        valid: false,
        reason: "not-found",
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Warning: Repo 'myrepo' not found at path: /path/to/repo",
      );
    });

    it("should log warning for not-git path", () => {
      logRepoValidationWarning("project", "/home/user/folder", {
        valid: false,
        reason: "not-git",
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Warning: Path '/home/user/folder' for repo 'project' is not a git repository",
      );
    });

    it("should log warning for no-permission", () => {
      logRepoValidationWarning("restricted", "/root/secret", {
        valid: false,
        reason: "no-permission",
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Warning: No permission to read repo 'restricted' at path: /root/secret",
      );
    });

    it("should handle repo names with special characters", () => {
      logRepoValidationWarning("my-repo_v2.0", "/path/with spaces", {
        valid: false,
        reason: "not-found",
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Warning: Repo 'my-repo_v2.0' not found at path: /path/with spaces",
      );
    });

    it("should handle paths with tilde", () => {
      logRepoValidationWarning("home-repo", "~/projects/repo", {
        valid: false,
        reason: "not-git",
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Warning: Path '~/projects/repo' for repo 'home-repo' is not a git repository",
      );
    });

    it("should handle unicode in repo names", () => {
      logRepoValidationWarning("项目", "/path/项目", {
        valid: false,
        reason: "no-permission",
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Warning: No permission to read repo '项目' at path: /path/项目",
      );
    });
  });
});
