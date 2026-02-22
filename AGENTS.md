# BehaviorCN Agent Guide

This repository is the **Source of Truth** for the "Behavior UI" library (the shadcn equivalent for behaviors).

## Package Management
We use **pnpm** for package management in this repository. Please use `pnpm` for installing dependencies and running scripts.

## Core Philosophy

1.  **Source-as-Registry:** The code lives in `registry/behaviors/` as real TypeScript files.
2.  **Decoupled Logic:** Behaviors are standalone modules. They do not know about the consuming app's registry until wired up.
3.  **Type Safety:** Every behavior exports a Zod schema (`_behavior-definition.ts`) that drives runtime validation and TypeScript intellisense.
4.  **Headless:** Logic only. No styles.

## Directory Structure

```text
behavior-cn/
├── registry/
│   ├── behaviors/           <-- The Source Code (Edit here!)
│   │   ├── reveal/
│   │   │   ├── _behavior-definition.ts
│   │   │   ├── behavior.ts
│   │   │   └── behavior.test.ts
│   │   └── logger/
│   │       └── ...
│   └── behaviors-registry.json  <-- Metadata ONLY (dependencies, file list)
├── index.ts                 <-- The CLI Tool
└── README.md                <-- Documentation
```

## Workflow for Adding a Behavior

1.  **Create the Code:**
    - Create a folder in `registry/behaviors/<name>/`.
    - Add `_behavior-definition.ts` (the contract).
    - Add `behavior.ts` (the logic).
    - Add `behavior.test.ts` (the tests).

2.  **Register Metadata:**
    - Add an entry to `registry/behaviors-registry.json`.
    - Include `name`, `dependencies` (if any), and the list of files.
    - **Do NOT include content.** The CLI reads the content from the files on disk.

3.  **Test Installation:**
    - Run `npx tsx index.ts add <name>` in a consuming project to verify it installs correctly.

## The CLI Tool (`index.ts`)

The CLI tool is responsible for:

1.  Reading `behaviors-registry.json` to find the behavior.
2.  Reading the source files from `registry/behaviors/`.
3.  Copying them to the target project's `src/components/html/behaviors/` directory.
4.  Installing dependencies (if any).

## Key Files

- **`registry/behaviors/behavior-utils.ts`**: The shared infrastructure (like shadcn's `lib/utils.ts`). This is installed by `init`.
- **`registry/behaviors/behavior-registry.ts`**: The runtime loader that auto-wires behavior logic using `import.meta.glob`. This is installed by `init`.

## Task Management

We manage tasks in [TASKS.md](./TASKS.md). Please refer to that file for the current backlog and completed tasks.

