import { z } from "zod";

/**
 * Package metadata schema
 * Validates name, version, and description from package.json
 */
export const PackageInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
});
