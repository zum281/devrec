/**
 * Formats commit date for display
 * @param dateString - ISO date string
 * @param locale - Locale for date formatting
 * @returns Formatted date string
 */
export const formatDate = (dateString: string, locale: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};
