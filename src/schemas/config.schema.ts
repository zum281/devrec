import { z } from "zod";

/**
 * Repository configuration schema
 * Validates repository name and path
 */
export const RepoSchema = z
  .object({
    name: z.string(),
    path: z.string(),
    mainBranch: z.string().optional(),
  })
  .strict();

/**
 * Main configuration schema
 * Validates author emails and repository list
 */
export const ConfigSchema = z
  .object({
    authorEmails: z.array(z.email()),
    repos: z.array(RepoSchema),
    sprintLength: z.number().int().positive().default(2),
    groupBy: z.enum(["repo", "category"]).default("repo"),
    locale: z
      .string()
      .default("en-US")
      .refine(
        locale => {
          try {
            new Intl.DateTimeFormat(locale);
            return true;
          } catch {
            return false;
          }
        },
        {
          message:
            "Invalid locale format. Use formats like 'en-US', 'it-IT', 'fr-FR', etc.",
        },
      ),
    mainBranch: z.string().default("main"),
    branchStrategy: z.enum(["all", "remote"]).default("all"),
  })
  .strict();
