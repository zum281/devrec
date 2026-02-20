# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code
in this repository.

## Commands

```bash
npm run dev <command>     # Run CLI without building (e.g. npm run dev today)
npm run build             # Bundle with esbuild to dist/
npm run test              # Run all tests with Vitest
npm run test:coverage     # Run tests with coverage (thresholds: 75% lines/functions/statements, 70% branches)
npm run lint              # ESLint check
npm run lint:fix          # Auto-fix ESLint issues
npm run check             # TypeScript type checking (strict)
npm run format            # Prettier formatting
```

Run a single test file:

```bash
npx vitest run src/utils/__tests__/commits.test.ts
```

## Architecture

devrec is a CLI tool that fetches git commits from multiple repos, categorizes them
by conventional commit prefixes, and outputs markdown or plain-text summaries.

### Layer flow

```
CLI entry (src/cli/main.ts)
  -> Commands (src/cli/commands/)
       -> create-time-range-command.ts  # Factory; all time-range commands are instances of this
       -> init.ts                       # Interactive config setup via Inquirer
  -> Core logic (src/utils/commits.ts)  # fetchAndCategorizeCommitsWithBranches, filterCommits, outputCommits
  -> Git layer (src/utils/git-log.ts)   # simple-git wrapper; enriches commits with branch info and merge status
  -> Output formatters (src/utils/output/)
       -> markdown.ts / plain.ts        # Top-level formatters
       -> generate-sections.ts          # repo-first vs category-first grouping
       -> format-commit.ts, calculate-stats.ts, format-date.ts
```

### Key design points

- **Importance scoring**: `src/utils/importance.ts` scores commits via keyword
  detection (`scoreCommit`) and merge status (`detectImportanceByMergeStatus`).
  `partitionByImportance` splits commits into `key` (high/medium) and `other` (low).
- **Commit relationships**: `src/utils/commit-relationships.ts` groups commits by
  shared Jira ticket key and/or branch name via `findRelatedCommits`.
- **Batch categorization**: `src/utils/categorize-commits-batch.ts` provides
  `categorizeCommitsBatch` and `mergeCategorizedCommits` as standalone helpers.
- **Config**: `~/.config/devrec/config.json`, validated with Zod
  (`src/schemas/config.schema.ts`). Required fields: `authorEmails`, `repos`. All
  others have defaults.
- **Categorization**: Pattern-matched in `src/utils/category-patterns.ts` against
  commit message prefixes (`feat:`, `fix:`, `refactor:`, etc.). Jira-formatted
  messages are stripped before matching. Merge commits are excluded.
- **Branch enrichment**: `git-log.ts` runs `git branch --contains <hash>` per commit
  to determine which branches contain it, and whether it is merged into the
  configured `mainBranch`.
- **Filtering**: `src/utils/category-filter.ts` resolves `--category` flag values;
  `src/utils/commits.ts` applies both repo and category filters after fetching.
- **Types**: All shared types live in `src/types.ts`. `CommitWithBranch` is the
  primary enriched commit type; `OutputOptions` carries CLI flags through to
  formatters.

### Available time-range commands

`today`, `yesterday`, `week`, `sprint`, `all` — each in
`src/cli/commands/<name>.ts`, delegating to `createTimeRangeCommand`.

### Adding a new time-range command

Call `createTimeRangeCommand` from `src/cli/commands/create-time-range-command.ts`,
pass a `DateRange` producer, and register in `src/cli/main.ts`.

## Conventions

- Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`,
  `ci:`).
- JSDoc on all exported functions.
- Zod schemas for any external data (config files, JSON).
- Tests co-located in `__tests__/` subdirectories next to source files.
- Path alias: `@/*` maps to `src/*`.

### Enforced code style (ESLint)

- `type` not `interface` for type definitions.
- `import type` for type-only imports.
- `Array<T>` not `T[]` for array types.
- Boolean variables prefixed with `is`/`has`/`can`/`should`/`will`/`did`.
- PascalCase types with no `I` prefix. kebab-case filenames.
- Single-letter generics (`T`, `K`, `V`).
