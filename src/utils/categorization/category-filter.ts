import { categoryPatterns } from "./category-patterns";

/**
 * Resolves a user-provided category filter to an exact category name
 * using 3-tier priority matching: exact → case-insensitive exact → prefix
 * @param filter - User input category filter (e.g., "feat", "Feature", "f")
 * @returns Exact category name
 * @throws Error if filter is ambiguous or matches no categories
 */
export const resolveCategoryFilter = (filter: string): string => {
  const availableCategories = Object.keys(categoryPatterns);

  // Tier 1: Exact match (case-sensitive)
  if (availableCategories.includes(filter)) {
    return filter;
  }

  // Tier 2: Case-insensitive exact match
  const lowerFilter = filter.toLowerCase();
  const exactCaseInsensitive = availableCategories.find(
    cat => cat.toLowerCase() === lowerFilter,
  );
  if (exactCaseInsensitive) {
    return exactCaseInsensitive;
  }

  // Tier 3: Case-insensitive prefix match
  const prefixMatches = availableCategories.filter(cat =>
    cat.toLowerCase().startsWith(lowerFilter),
  );

  if (prefixMatches.length === 0) {
    throw new Error(
      `Unknown category filter "${filter}". Available categories: ${availableCategories.join(", ")}`,
    );
  }

  if (prefixMatches.length > 1) {
    throw new Error(
      `Ambiguous category filter "${filter}" matches: ${prefixMatches.join(", ")}. Please be more specific.`,
    );
  }

  return prefixMatches[0];
};
