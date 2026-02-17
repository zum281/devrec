/**
 * Calculates the date range for a specific date (00:00 to 23:59)
 * @param date - Date object (defaults to today)
 * @returns Object with since and until date strings
 */
export const getDateRange = (
  date: Date = new Date(),
): { since: string; until: string } => {
  return {
    since: date.toDateString(),
    until: date.toDateString(),
  };
};

/**
 * Calculates the date range for yesterday (00:00 to 23:59)
 * @returns Object with since and until date strings
 */
export const getYesterdayDateRange = (): { since: string; until: string } => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateRange(yesterday);
};

/**
 * Calculates the date range for the current calendar week
 * If today is Monday, shows previous complete week (Mon-Sun)
 * Otherwise shows from last Monday to today
 * @returns Object with since and until date strings
 */
export const getWeekDateRange = (): { since: string; until: string } => {
  const today = new Date();
  const lastMonday = new Date();

  const daysSinceMonday = (today.getDay() + 6) % 7;

  if (daysSinceMonday === 0) {
    // Today is Monday - show previous complete week (last Mon to last Sun)
    lastMonday.setDate(today.getDate() - 7); // Previous Monday
    const lastSunday = new Date();
    lastSunday.setDate(today.getDate() - 1); // Yesterday (Sunday)

    return {
      since: lastMonday.toDateString(),
      until: lastSunday.toDateString(),
    };
  } else {
    // Not Monday - show from last Monday to today
    lastMonday.setDate(today.getDate() - daysSinceMonday);

    return {
      since: lastMonday.toDateString(),
      until: today.toDateString(),
    };
  }
};

/**
 * Calculates the date range for the current sprint
 * @param sprintLength - Number of weeks in a sprint
 * @returns Object with since and until date strings
 */
export const getSprintDateRange = (
  sprintLength: number,
): { since: string; until: string } => {
  const today = new Date();
  const sprintStartMonday = new Date();

  // Find most recent Monday (or today if Monday)
  const daysSinceMonday = (today.getDay() + 6) % 7;
  sprintStartMonday.setDate(today.getDate() - daysSinceMonday);

  // Go back sprintLength weeks from that Monday
  sprintStartMonday.setDate(sprintStartMonday.getDate() - sprintLength * 7);

  return {
    since: sprintStartMonday.toDateString(),
    until: today.toDateString(),
  };
};

/**
 * Calculates the date range for the last two weeks starting from Monday
 * @returns Object with since and until date strings
 */
export const getLastTwoWeeksDateRange = (): { since: string; until: string } => {
  const today = new Date();
  const lastMonday = new Date();

  // Calculate Monday from two weeks ago as the start of the date range
  lastMonday.setDate(lastMonday.getDate() - ((lastMonday.getDay() + 6) % 7) - 7);

  return {
    since: lastMonday.toDateString(),
    until: today.toDateString(),
  };
};
