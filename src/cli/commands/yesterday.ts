import { getYesterdayDateRange } from "@/utils/date";
import { createTimeRangeCommand } from "./create-time-range-command";

/**
 * Registers the yesterday command
 * @param program - Commander program instance
 */
export const registerYesterdayCommand = createTimeRangeCommand(
  "yesterday",
  "Show commits from yesterday",
  getYesterdayDateRange,
);
