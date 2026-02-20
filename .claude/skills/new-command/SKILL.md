---
name: new-command
description:
  Scaffold a new time-range CLI command following the createTimeRangeCommand factory
  pattern
---

Scaffold a new time-range command for devrec.

Arguments: {{args}}

Steps:

1. Create `src/cli/commands/<name>.ts` that calls `createTimeRangeCommand` from
   `./create-time-range-command.ts` with a `DateRange` producer. Follow the pattern
   of existing commands (today.ts, yesterday.ts, week.ts, sprint.ts, all.ts).
2. Register the command in `src/cli/main.ts` alongside the existing commands.
3. Create `src/cli/commands/__tests__/<name>.test.ts` following the co-located test
   pattern.
4. Follow all project ESLint conventions in every file you create or modify:
   - JSDoc on all exported functions with explicit `@param` and `@returns`
   - `import type` for type-only imports
   - `Array<T>` not `T[]`
   - `type` not `interface` for type definitions
   - Boolean variable prefixes (is/has/can/should/will/did)
   - PascalCase type names; single-letter generics (`T`, `K`, `V`)
   - kebab-case filenames
5. Run `npm run check && npm run lint && npm run test` to verify.
