import type { ImportanceLevel } from "@/types";

/**
 * Detects commit importance by scanning the message for high-signal keywords.
 * Matches are case-insensitive and position-independent (anywhere in the message).
 * Returns the highest matching tier (high, then medium, then low as default fallback).
 * Operates on raw strings -- caller should pre-clean Jira prefixes if needed.
 */
export const detectImportanceByKeyword = (commitMsg: string): ImportanceLevel => {
  for (const [importance, patterns] of Object.entries(importancePatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(commitMsg)) {
        return importance as ImportanceLevel;
      }
    }
  }

  return "low";
};

/**
 * Keyword patterns grouped by importance tier.
 * High: security incidents, breaking changes, hotfixes.
 * Medium: performance, migrations, deprecations, regressions.
 * Low: empty (catchall fallback).
 */
export const importancePatterns: Record<ImportanceLevel, Array<RegExp>> = {
  high: [
    /security/i,
    /critical/i,
    /breaking/i,
    /hotfix/i,
    /vulnerability/i,
    /urgent/i,
  ],
  medium: [/performance/i, /migration/i, /deprecat(e|ed|ion)/i, /regression/i],
  low: [],
} as const;
