/**
 * Category patterns for commit message classification
 */
export const categoryPatterns = {
  Feature: [/^feat[/:]/i, /^feature[/:]/i, /^feat\(/i],
  Bug: [/^fix[/:]/i, /^bugfix[/:]/i, /^fix\(/i],
  Refactor: [/^refactor[/:]/i, /^refactor\(/i],
  Test: [/^test[/:]/i, /^test\(/i],
  Chore: [/^chore[/:]/i, /^chore\(/i],
  Documentation: [/^docs[/:]/i, /^documentation[/:]/i, /^docs\(/i],
  CI: [/^ci[/:]/i, /^ci\(/i],
} as const;

/**
 * Extracts actual commit message from Jira-formatted commits
 * Handles: Resolve TICKET-ID "message" and Resolve TICKET-ID message
 */
export const extractMessageFromJira = (message: string): string => {
  const jiraWithQuotes = /^resolve\s+[\da-z]+-\d+\s+"(.+)"$/i;
  const jiraWithoutQuotes = /^resolve\s+[\da-z]+-\d+\s+(.+)$/i;

  const quotedMatch = jiraWithQuotes.exec(message);
  if (quotedMatch) return quotedMatch[1];

  const unquotedMatch = jiraWithoutQuotes.exec(message);
  if (unquotedMatch) return unquotedMatch[1];

  return message;
};

/**
 * Checks if a commit message is a merge commit
 */
export const isMergeCommit = (message: string): boolean => {
  return /^merge branch/i.test(message);
};

/**
 * Categorizes a commit message based on patterns
 * Returns the category name, "Other" if no match, or null for merge commits
 */
export const categorizeCommit = (message: string): string | null => {
  if (isMergeCommit(message)) {
    return null;
  }

  const cleanMessage = extractMessageFromJira(message);

  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(cleanMessage)) {
        return category;
      }
    }
  }

  return "Other";
};
