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

    expect(result.since).toBe("Fri Feb 20 2026");
    expect(result.until).toBe("Fri Feb 20 2026");
  });

  test("returns range for specific date", () => {
    const date = new Date("2026-02-20");
    const result = getDateRange(date);

    expect(result.since).toBe("Fri Feb 20 2026");
    expect(result.until).toBe("Fri Feb 20 2026");
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

    expect(result.since).toBe("Thu Feb 19 2026");
    expect(result.until).toBe("Thu Feb 19 2026");
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

    expect(result.since).toBe("Mon Feb 16 2026");
    expect(result.until).toBe("Fri Feb 20 2026");
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

    expect(result.since).toBe("Mon Feb 09 2026");
    expect(result.until).toBe("Fri Feb 20 2026");
  });

  test("calculates 1-week sprint", () => {
    const result = getSprintDateRange(1);

    expect(result.since).toBe("Mon Feb 16 2026");
    expect(result.until).toBe("Fri Feb 20 2026");
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

    expect(result.since).toBe("Mon Feb 09 2026");
    expect(result.until).toBe("Fri Feb 20 2026");
  });
});
