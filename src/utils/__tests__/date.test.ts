import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { FIXED_DATE } from "@/utils/__tests__/fixtures";
import {
  getDateRange,
  getLastTwoWeeksDateRange,
  getSprintDateRange,
  getWeekDateRange,
  getYesterdayDateRange,
} from "../date";

describe("getDateRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("returns range for today by default", () => {
    const result = getDateRange();

    expect(result.since).toBe("Fri Mar 15 2024");
    expect(result.until).toBe("Fri Mar 15 2024");
  });

  test("returns range for specific date", () => {
    const date = new Date("2024-03-15");
    const result = getDateRange(date);

    expect(result.since).toBe("Fri Mar 15 2024");
    expect(result.until).toBe("Fri Mar 15 2024");
  });
});

describe("getYesterdayDateRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("returns range for yesterday", () => {
    const result = getYesterdayDateRange();

    expect(result.since).toBe("Thu Mar 14 2024");
    expect(result.until).toBe("Thu Mar 14 2024");
  });
});

describe("getWeekDateRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("returns date range for the week", () => {
    const result = getWeekDateRange();

    expect(result.since).toBe("Mon Mar 11 2024");
    expect(result.until).toBe("Fri Mar 15 2024");
  });
});

describe("getSprintDateRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("calculates 2-week sprint", () => {
    const result = getSprintDateRange(2);

    expect(result.since).toBe("Mon Feb 26 2024");
    expect(result.until).toBe("Fri Mar 15 2024");
  });

  test("calculates 1-week sprint", () => {
    const result = getSprintDateRange(1);

    expect(result.since).toBe("Mon Mar 04 2024");
    expect(result.until).toBe("Fri Mar 15 2024");
  });
});

describe("getLastTwoWeeksDateRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("calculates Monday from two weeks ago", () => {
    const result = getLastTwoWeeksDateRange();

    expect(result.since).toBe("Mon Mar 04 2024");
    expect(result.until).toBe("Fri Mar 15 2024");
  });
});
