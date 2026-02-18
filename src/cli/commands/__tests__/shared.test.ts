import { Command } from "commander";
import { describe, expect, test } from "vitest";
import { addCommonOptions } from "../shared";

describe("addCommonOptions", () => {
  test("adds all common options to command", () => {
    const command = new Command("test");
    const result = addCommonOptions(command);

    expect(result).toBe(command);

    const options = command.options;
    expect(options).toHaveLength(6);

    const optionNames = options.map(opt => opt.long);
    expect(optionNames).toContain("--format");
    expect(optionNames).toContain("--color");
    expect(optionNames).toContain("--summary");
    expect(optionNames).toContain("--repo");
    expect(optionNames).toContain("--category");
    expect(optionNames).toContain("--highlight");
  });

  test("format option has correct default", () => {
    const command = new Command("test");
    addCommonOptions(command);

    const formatOption = command.options.find(opt => opt.long === "--format");
    expect(formatOption?.defaultValue).toBe("plain");
  });

  test("color option has correct default", () => {
    const command = new Command("test");
    addCommonOptions(command);

    const colorOption = command.options.find(opt => opt.long === "--color");
    expect(colorOption?.defaultValue).toBe("auto");
  });

  test("summary option has correct default", () => {
    const command = new Command("test");
    addCommonOptions(command);

    const summaryOption = command.options.find(opt => opt.long === "--summary");
    expect(summaryOption?.defaultValue).toBe(false);
  });
});
