import { describe, expect, it } from "vitest";
import {
  detectImportanceByKeyword,
  detectImportanceByMergeStatus,
  partitionByImportance,
  scoreCommit,
} from "../importance";
import { createCommitWithBranch } from "./fixtures";

describe("detectImportanceByKeyword", () => {
  describe("high importance", () => {
    it("should recognise 'security'", () => {
      const commitMgsWithSecurityBeginning = "security: blablabla";
      const commitMgsWithSecurityMiddle = "feat: made some security stuff";
      const commitMgsWithSecurityEnd = "update security";

      expect(detectImportanceByKeyword(commitMgsWithSecurityBeginning)).toBe(
        "high",
      );
      expect(detectImportanceByKeyword(commitMgsWithSecurityMiddle)).toBe("high");
      expect(detectImportanceByKeyword(commitMgsWithSecurityEnd)).toBe("high");
    });
    it("should recognise 'critical'", () => {
      const commitMgsWithCriticalBeginning = "critical update";
      const commitMgsWithCriticalMiddle = "feat(critical): something";
      const commitMgsWithCriticalEnd = "fix critical";

      expect(detectImportanceByKeyword(commitMgsWithCriticalBeginning)).toBe(
        "high",
      );
      expect(detectImportanceByKeyword(commitMgsWithCriticalMiddle)).toBe("high");
      expect(detectImportanceByKeyword(commitMgsWithCriticalEnd)).toBe("high");
    });
    it("should recognise 'breaking'", () => {
      const commitMgsWithBreakingBeginning = "breaking change";
      const commitMgsWithBreakingMiddle = "feat: breaking change";
      const commitMgsWithBreakingEnd = "fix breaking";

      expect(detectImportanceByKeyword(commitMgsWithBreakingBeginning)).toBe(
        "high",
      );
      expect(detectImportanceByKeyword(commitMgsWithBreakingMiddle)).toBe("high");
      expect(detectImportanceByKeyword(commitMgsWithBreakingEnd)).toBe("high");
    });
    it("should recognise 'hotfix'", () => {
      const commitMgsWithHotfixBeginning = "hotfix: blablabla";
      const commitMgsWithHotfixMiddle = "fix(hotfix): stuff";
      const commitMgsWithHotfixEnd = "some hotfix";

      expect(detectImportanceByKeyword(commitMgsWithHotfixBeginning)).toBe("high");
      expect(detectImportanceByKeyword(commitMgsWithHotfixMiddle)).toBe("high");
      expect(detectImportanceByKeyword(commitMgsWithHotfixEnd)).toBe("high");
    });
    it("should recognise 'vulnerability'", () => {
      const commitMgsWithVulnerabilityBeginning = "vulnerability: blablabla";
      const commitMgsWithVulnerabilityMiddle = "fix(vulnerability): stuff";
      const commitMgsWithVulnerabilityEnd = "fix some vulnerability";

      expect(detectImportanceByKeyword(commitMgsWithVulnerabilityBeginning)).toBe(
        "high",
      );
      expect(detectImportanceByKeyword(commitMgsWithVulnerabilityMiddle)).toBe(
        "high",
      );
      expect(detectImportanceByKeyword(commitMgsWithVulnerabilityEnd)).toBe("high");
    });
    it("should recognise 'urgent'", () => {
      const commitMgsWithUrgentBeginning = "urgent: blablabla";
      const commitMgsWithUrgentMiddle = "fix(urgent): stuff";
      const commitMgsWithUrgentEnd = "this is urgent";

      expect(detectImportanceByKeyword(commitMgsWithUrgentBeginning)).toBe("high");
      expect(detectImportanceByKeyword(commitMgsWithUrgentMiddle)).toBe("high");
      expect(detectImportanceByKeyword(commitMgsWithUrgentEnd)).toBe("high");
    });
  });
  describe("medium importance", () => {
    it("should recognise 'performance'", () => {
      const commitMgsWithPerformanceBeginning = "performance: blablabla";
      const commitMgsWithPerformanceMiddle = "fix(performance): stuff";
      const commitMgsWithPerformanceEnd = "improved performance";

      expect(detectImportanceByKeyword(commitMgsWithPerformanceBeginning)).toBe(
        "medium",
      );
      expect(detectImportanceByKeyword(commitMgsWithPerformanceMiddle)).toBe(
        "medium",
      );
      expect(detectImportanceByKeyword(commitMgsWithPerformanceEnd)).toBe("medium");
    });
    it("should recognise 'migration'", () => {
      const commitMgsWithMigrationBeginning = "migration: blablabla";
      const commitMgsWithMigrationMiddle = "feat(migration): stuff";
      const commitMgsWithMigrationEnd = "some library migration";

      expect(detectImportanceByKeyword(commitMgsWithMigrationBeginning)).toBe(
        "medium",
      );
      expect(detectImportanceByKeyword(commitMgsWithMigrationMiddle)).toBe(
        "medium",
      );
      expect(detectImportanceByKeyword(commitMgsWithMigrationEnd)).toBe("medium");
    });
    it("should recognise 'deprecate'", () => {
      const commitMgsWithDeprecateBeginning = "deprecate some function";
      const commitMgsWithDeprecateMiddle = "fix: removed deprecated dependency";
      const commitMgsWithDeprecateEnd = "tool deprecated";
      const commitMgsWithDeprecationBeginning = "deprecation of something";
      const commitMgsWithDeprecationMiddle = "fix: deprecation of tool";
      const commitMgsWithDeprecationEnd = "some library deprecation";

      expect(detectImportanceByKeyword(commitMgsWithDeprecateBeginning)).toBe(
        "medium",
      );
      expect(detectImportanceByKeyword(commitMgsWithDeprecateMiddle)).toBe(
        "medium",
      );
      expect(detectImportanceByKeyword(commitMgsWithDeprecateEnd)).toBe("medium");
      expect(detectImportanceByKeyword(commitMgsWithDeprecationBeginning)).toBe(
        "medium",
      );
      expect(detectImportanceByKeyword(commitMgsWithDeprecationMiddle)).toBe(
        "medium",
      );
      expect(detectImportanceByKeyword(commitMgsWithDeprecationEnd)).toBe("medium");
    });
    it("should recognise 'regression'", () => {
      const commitMgsWithRegressionBeginning = "regression fix";
      const commitMgsWithRegressionMiddle = "fix(regression): stuff";
      const commitMgsWithRegressionEnd = "fixedRegression";

      expect(detectImportanceByKeyword(commitMgsWithRegressionBeginning)).toBe(
        "medium",
      );
      expect(detectImportanceByKeyword(commitMgsWithRegressionMiddle)).toBe(
        "medium",
      );
      expect(detectImportanceByKeyword(commitMgsWithRegressionEnd)).toBe("medium");
    });
  });
  describe("low importance", () => {
    it("should be the fallback", () => {
      const commitMgs = "some commit with no keywords";

      expect(detectImportanceByKeyword(commitMgs)).toBe("low");
    });
  });

  describe("edge cases", () => {
    it("should return low for empty string", () => {
      expect(detectImportanceByKeyword("")).toBe("low");
    });

    it("should return low for whitespace-only input", () => {
      expect(detectImportanceByKeyword("   ")).toBe("low");
    });

    it("should return highest tier when multiple keywords match", () => {
      const msgWithHighAndMedium = "fix: critical performance regression";

      expect(detectImportanceByKeyword(msgWithHighAndMedium)).toBe("high");
    });

    it("should match mixed-case keywords", () => {
      expect(detectImportanceByKeyword("SeCuRiTy patch")).toBe("high");
      expect(detectImportanceByKeyword("BREAKING change")).toBe("high");
      expect(detectImportanceByKeyword("Performance boost")).toBe("medium");
    });

    it("should match keywords in Jira-style messages (raw, uncleaned)", () => {
      expect(
        detectImportanceByKeyword('Resolve PROJ-123 "fix critical auth bug"'),
      ).toBe("high");
      expect(
        detectImportanceByKeyword("Resolve PROJ-456 performance improvement"),
      ).toBe("medium");
    });
  });
});

describe("detectImportanceByMergeStatus", () => {
  it("should return medium for merged commits", () => {
    expect(detectImportanceByMergeStatus(true)).toBe("medium");
  });

  it("should return low for unmerged commits", () => {
    expect(detectImportanceByMergeStatus(false)).toBe("low");
  });
});

describe("partitionByImportance", () => {
  it("should place high-importance commits in key", () => {
    const commits = [
      createCommitWithBranch({ message: "security: patch auth", isMerged: true }),
    ];
    const { key, other } = partitionByImportance(commits);
    expect(key).toHaveLength(1);
    expect(other).toHaveLength(0);
  });

  it("should place medium-importance commits in key", () => {
    const commits = [
      createCommitWithBranch({
        message: "performance: optimize query",
        isMerged: false,
      }),
    ];
    const { key, other } = partitionByImportance(commits);
    expect(key).toHaveLength(1);
    expect(other).toHaveLength(0);
  });

  it("should place low-importance commits in other", () => {
    const commits = [
      createCommitWithBranch({ message: "feat: add button", isMerged: false }),
    ];
    const { key, other } = partitionByImportance(commits);
    expect(key).toHaveLength(0);
    expect(other).toHaveLength(1);
  });

  it("should split mixed-importance commits correctly", () => {
    const commits = [
      createCommitWithBranch({ message: "security: patch", isMerged: true }),
      createCommitWithBranch({ message: "feat: add button", isMerged: false }),
      createCommitWithBranch({ message: "performance: optimize", isMerged: false }),
      createCommitWithBranch({ message: "chore: update deps", isMerged: false }),
    ];
    const { key, other } = partitionByImportance(commits);
    expect(key).toHaveLength(2);
    expect(other).toHaveLength(2);
  });

  it("should return empty arrays for empty input", () => {
    const { key, other } = partitionByImportance([]);
    expect(key).toHaveLength(0);
    expect(other).toHaveLength(0);
  });
});

describe("scoreCommit", () => {
  describe("signal combination matrix", () => {
    it("should return high when keyword is high and commit is merged", () => {
      const commit = createCommitWithBranch({
        message: "security: patch auth bypass",
        isMerged: true,
      });
      expect(scoreCommit(commit)).toBe("high");
    });
    it("should return high when keyword is high and commit is unmerged", () => {
      const commit = createCommitWithBranch({
        message: "urgent: patch auth bypass",
        isMerged: false,
      });
      expect(scoreCommit(commit)).toBe("high");
    });
    it("should return high when keyword is medium and commit is merged (combined boost)", () => {
      const commit = createCommitWithBranch({
        message: "deprecation: remove some library",
        isMerged: true,
      });
      expect(scoreCommit(commit)).toBe("high");
    });
    it("should return medium when keyword is medium and commit is unmerged", () => {
      const commit = createCommitWithBranch({
        message: "deprecation: remove some library",
        isMerged: false,
      });
      expect(scoreCommit(commit)).toBe("medium");
    });
    it("should return medium when keyword is low and commit is merged", () => {
      const commit = createCommitWithBranch({
        message: "some other message",
        isMerged: true,
      });
      expect(scoreCommit(commit)).toBe("medium");
    });
    it("should return low when keyword is low and commit is unmerged", () => {
      const commit = createCommitWithBranch({
        message: "some other message",
        isMerged: false,
      });
      expect(scoreCommit(commit)).toBe("low");
    });
  });
});
