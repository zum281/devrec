import { getDateRange } from "@/utils/date";
import { createTimeRangeCommand } from "./create-time-range-command";

/**
 * Registers the today command
 * @param program - Commander program instance
 */
export const registerTodayCommand = createTimeRangeCommand(
  "today",
  "Show commits from today",
  getDateRange,
);
