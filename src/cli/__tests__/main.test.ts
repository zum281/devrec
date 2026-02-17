import { Command } from "commander";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/utils/read-package");
vi.mock("../commands/init");
vi.mock("../commands/today");
vi.mock("../commands/yesterday");
vi.mock("../commands/week");
vi.mock("../commands/sprint");
vi.mock("../commands/all");

describe("main", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("registers all commands with correct configuration", async () => {
    const { readPackageInfo } = await import("@/utils/read-package");
    const { registerInitCommand } = await import("../commands/init");
    const { registerTodayCommand } = await import("../commands/today");
    const { registerYesterdayCommand } = await import("../commands/yesterday");
    const { registerWeekCommand } = await import("../commands/week");
    const { registerSprintCommand } = await import("../commands/sprint");
    const { registerAllCommand } = await import("../commands/all");

    vi.mocked(readPackageInfo).mockResolvedValue({
      name: "devrec",
      version: "1.0.0",
      description: "A developer log tool",
    });

    vi.mocked(registerInitCommand).mockImplementation(vi.fn());
    vi.mocked(registerTodayCommand).mockImplementation(vi.fn());
    vi.mocked(registerYesterdayCommand).mockImplementation(vi.fn());
    vi.mocked(registerWeekCommand).mockImplementation(vi.fn());
    vi.mocked(registerSprintCommand).mockImplementation(vi.fn());
    vi.mocked(registerAllCommand).mockImplementation(vi.fn());

    const { main } = await import("../main");

    const parseSpy = vi.spyOn(Command.prototype, "parse");
    parseSpy.mockImplementation(vi.fn());

    await main();

    expect(registerInitCommand).toHaveBeenCalled();
    expect(registerTodayCommand).toHaveBeenCalled();
    expect(registerYesterdayCommand).toHaveBeenCalled();
    expect(registerWeekCommand).toHaveBeenCalled();
    expect(registerSprintCommand).toHaveBeenCalled();
    expect(registerAllCommand).toHaveBeenCalled();
    expect(parseSpy).toHaveBeenCalled();
  });

  test("sets program metadata from package.json", async () => {
    const { readPackageInfo } = await import("@/utils/read-package");

    vi.mocked(readPackageInfo).mockResolvedValue({
      name: "test-name",
      version: "2.0.0",
      description: "Test description",
    });

    const { registerInitCommand } = await import("../commands/init");
    const { registerTodayCommand } = await import("../commands/today");
    const { registerYesterdayCommand } = await import("../commands/yesterday");
    const { registerWeekCommand } = await import("../commands/week");
    const { registerSprintCommand } = await import("../commands/sprint");
    const { registerAllCommand } = await import("../commands/all");

    vi.mocked(registerInitCommand).mockImplementation(vi.fn());
    vi.mocked(registerTodayCommand).mockImplementation(vi.fn());
    vi.mocked(registerYesterdayCommand).mockImplementation(vi.fn());
    vi.mocked(registerWeekCommand).mockImplementation(vi.fn());
    vi.mocked(registerSprintCommand).mockImplementation(vi.fn());
    vi.mocked(registerAllCommand).mockImplementation(vi.fn());

    const { main } = await import("../main");

    let capturedProgram: Command | undefined;
    vi.mocked(registerInitCommand).mockImplementation((program: Command) => {
      capturedProgram = program;
    });

    const parseSpy = vi.spyOn(Command.prototype, "parse");
    parseSpy.mockImplementation(vi.fn());

    await main();

    expect(capturedProgram).toBeDefined();
    if (capturedProgram) {
      expect(capturedProgram.name()).toBe("test-name");
      expect(capturedProgram.version()).toBe("2.0.0");
      expect(capturedProgram.description()).toBe("Test description");
    }
  });

  test("handles readPackageInfo error", async () => {
    const { readPackageInfo } = await import("@/utils/read-package");

    const testError = new Error("Package.json not found");
    vi.mocked(readPackageInfo).mockRejectedValue(testError);

    const { main } = await import("../main");

    await expect(main()).rejects.toThrow("Package.json not found");
  });
});
