import { getWeekDateRange } from "@/utils/shared/date";
import { createTimeRangeCommand } from "./create-time-range-command";

/**
 * Registers the week command
 * @param program - Commander program instance
 */
export const registerWeekCommand = createTimeRangeCommand(
  "week",
  "Show commits from the current week (Monday to today)",
  getWeekDateRange,
);
