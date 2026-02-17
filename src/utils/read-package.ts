import path from "node:path";
import { fileURLToPath } from "node:url";
import { PackageInfoSchema } from "@/schemas/package.schema";
import type { PackageInfo } from "@/types";
import { handleJsonFileError } from "./handle-json-file-error";
import { readJsonFile } from "./read-json-file";

/**
 * Reads and validates package.json metadata
 * @returns Package name, version, and description
 * @throws Exits process if package.json is missing or invalid
 */
export const readPackageInfo = async (): Promise<PackageInfo> => {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const packageJsonPath = path.resolve(dirname, "../..", "package.json");

  try {
    return await readJsonFile(packageJsonPath, PackageInfoSchema, "Package.json");
  } catch (error) {
    return handleJsonFileError(error, "Package.json");
  }
};
