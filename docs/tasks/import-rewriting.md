# Implement Import Rewriting

## Description

Implement robust import rewriting in the CLI to ensure that installed behaviors correctly reference the project's utilities and registry.

## Requirements

- **Aliases:** Support user-defined aliases for `utils`, `registry`, and `test-utils`.
- **Rewriting:**
  - Replace `~utils` with the configured alias.
  - Replace `~registry` with the configured alias.
  - Replace `~test-utils` with the configured alias.
- **Relative Imports:** Handle relative imports within the behavior directory correctly (e.g., `./_behavior-definition`).

## Implementation Plan

1.  **Update `index.ts`**:
    - Enhance `rewriteImports` function to handle more complex import patterns if needed.
    - Ensure it works for both `import` statements and `require` calls (if applicable, though we target ESM).

2.  **Testing:**
    - Create test cases with different alias configurations to verify rewriting works as expected.

## Status: Completed

- **Aliases:** Added support for `~host` alias pointing to `behavioral-host.ts`.
- **Rewriting:** The CLI now rewrites:
  - `~utils` -> `config.aliases.utils`
  - `~registry` -> `config.aliases.registry`
  - `~test-utils` -> `config.aliases.testUtils`
  - `~host` -> `config.aliases.host`
