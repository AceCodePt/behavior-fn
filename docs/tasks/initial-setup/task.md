# Initial Setup

## Description

Initialize the `behavior-cn` repository with the necessary configuration and directory structure.

## Requirements

- **Package Manager:** pnpm
- **Language:** TypeScript
- **Testing:** Vitest
- **Linting:** Prettier

## Implementation Plan

1.  **Initialize Project:**
    - `pnpm init`
    - `tsc --init`
    - Create `tsconfig.json` with strict mode.
    - Create `opencode.json` for agent configuration.

2.  **Directory Structure:**
    - `registry/behaviors/`
    - `docs/`
    - `dist/`

3.  **Dependencies:**
    - `typescript`
    - `vitest`
    - `tsup` (for building the CLI)
    - `zod` (for behavior definitions)
