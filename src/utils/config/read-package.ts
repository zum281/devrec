import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PackageInfoSchema } from "@/schemas/package.schema";
import type { PackageInfo } from "@/types";
import { handleJsonFileError } from "./handle-json-file-error";
import { readJsonFile } from "./read-json-file";

/**
 * Walks up the directory tree from startDir until package.json is found.
 * Used to locate the CLI's own package.json regardless of whether the code
 * is running from the TypeScript source (via tsx) or an esbuild bundle,
 * which may be at different directory depths relative to the project root.
 * @param startDir - Directory to start the search from
 * @returns Absolute path to the nearest package.json
 * @throws Error if no package.json is found before reaching the filesystem root
 */
export const findPackageJson = (startDir: string): string => {
  let dir = startDir;
  const candidate = path.join(dir, "package.json");
  if (existsSync(candidate)) return candidate;

  let parent = path.dirname(dir);
  while (parent !== dir) {
    const c = path.join(parent, "package.json");
    if (existsSync(c)) return c;
    dir = parent;
    parent = path.dirname(dir);
  }

  throw new Error("Could not find package.json");
};

/**
 * Reads and validates package.json metadata
 * @returns Package name, version, and description
 * @throws Exits process if package.json is missing or invalid
 */
export const readPackageInfo = async (): Promise<PackageInfo> => {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const packageJsonPath = findPackageJson(dirname);

  try {
    return await readJsonFile(packageJsonPath, PackageInfoSchema, "Package.json");
  } catch (error) {
    return handleJsonFileError(error, "Package.json");
  }
};
