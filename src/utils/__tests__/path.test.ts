import os from "node:os";
import { describe, expect, test } from "vitest";
import { expandTilde } from "../path";

describe("expandTilde", () => {
  test("expands tilde with slash", () => {
    const result = expandTilde("~/documents");
    expect(result).toBe(`${os.homedir()}/documents`);
  });

  test("expands standalone tilde", () => {
    const result = expandTilde("~");
    expect(result).toBe(os.homedir());
  });

  test("returns path unchanged without tilde", () => {
    const result = expandTilde("/absolute/path");
    expect(result).toBe("/absolute/path");
  });

  test("returns relative path unchanged", () => {
    const result = expandTilde("relative/path");
    expect(result).toBe("relative/path");
  });

  test("does not expand tilde in middle of path", () => {
    const result = expandTilde("/path/~/middle");
    expect(result).toBe("/path/~/middle");
  });
});
