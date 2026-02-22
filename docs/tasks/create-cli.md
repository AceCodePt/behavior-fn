# Create CLI Tool

## Description

Create the `behavior-cn` CLI tool to manage behavior installation and configuration.

## Requirements

- **Commands:**
  - `init`: Initialize the project with `behavior.json` and core files.
  - `add <behavior>`: Install a specific behavior and its dependencies.

- **Features:**
  - **Config Generation:** Create `behavior.json` with user preferences.
  - **Import Rewriting:** Rewrite `~utils`, `~registry`, etc. to user-defined aliases.
  - **Platform Detection:** Detect Astro/Next.js to configure `isServer` check.
  - **Dependency Installation:** Install npm dependencies required by behaviors.

## Implementation Plan

1.  **Setup:** Create `index.ts` with `#!/usr/bin/env node`.
2.  **Dependencies:** Use `prompts` for user interaction and `fs` for file operations.
3.  **Logic:**
    - Implement `loadConfig` and `saveConfig`.
    - Implement `installBehavior` which reads from `registry/behaviors-registry.json`.
    - Implement `rewriteImports` using regex or AST.
4.  **Build:** Use `tsup` to bundle the CLI into `dist/index.js`.
