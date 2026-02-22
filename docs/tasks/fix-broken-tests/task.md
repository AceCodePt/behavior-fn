# Fix Broken Tests

## Context
Running `pnpm test` revealed two failures:
1.  `registry/behaviors/reveal/behavior.test.ts` fails to import `./_behavior-definition`. This file does not exist; `reveal` uses `schema.ts`.
2.  `tests/index.test.ts` fails to resolve `prompts`. This might be a missing dependency or configuration issue in the test environment.

## Objectives
Fix the test suite so we have a green baseline before starting migrations.

## Steps
1.  **Fix Reveal Test**:
    -   Open `registry/behaviors/reveal/behavior.test.ts`.
    -   Remove the import of `./_behavior-definition`.
    -   Update the test to use `schema.ts` or hardcoded command strings if necessary, matching `behavior.ts` logic.
2.  **Fix Index Test**:
    -   Investigate why `prompts` is not resolving.
    -   It is listed in `devDependencies`.
    -   It might be a mocking issue in `vitest`.
3.  **Verify**: Run `pnpm test` and ensure all tests pass.

## Deliverables
-   All tests passing.
