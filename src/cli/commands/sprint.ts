import { getSprintDateRange } from "@/utils/date";
import { createTimeRangeCommand } from "./create-time-range-command";

/**
 * Registers the sprint command
 * @param program - Commander program instance
 */
export const registerSprintCommand = createTimeRangeCommand(
  "sprint",
  "Show commits from the current sprint",
  getSprintDateRange,
);
