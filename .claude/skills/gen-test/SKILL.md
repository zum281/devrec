---
name: gen-test
description:
  Generate a Vitest test file for a given source module, following the co-located
  __tests__/ pattern with fixtures
---

Generate a comprehensive Vitest test file for the source module: {{args}}

Rules:

- Read the source module fully before writing any tests
- Place test at `<same-dir>/__tests__/<filename>.test.ts`
- Import `describe`, `it`, `expect`, `vi` from `vitest`
- Use `vi.mock` for external modules (simple-git, fs, path, chalk)
- Check for a `fixtures.ts` in the same `__tests__/` directory and reuse its helpers
- Cover happy path, edge cases, error branches, and boundary values
- Follow ESLint conventions:
  - `import type` for type-only imports
  - `Array<T>` not `T[]`
  - No `interface`; use `type`
  - Boolean variable prefixes (is/has/can/should/will/did)
  - PascalCase type names; single-letter generics (`T`, `K`, `V`)
  - No `for` loops or `forEach`; use `.map`, `.filter`, `.reduce`, or other array
    methods
- Add JSDoc comments (with `@param` and `@returns`) to any helper functions you
  create in the test file
- Run `npm run test:coverage` after writing to verify thresholds (75%
  lines/functions/statements, 70% branches)
