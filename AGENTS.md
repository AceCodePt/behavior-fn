# BehaviorCN Agents Guide

Welcome to **BehaviorCN**. This repository is the **Source of Truth** for the "Behavior UI" library—a headless, type-safe, and registry-based collection of behavioral mixins for Web Components.

## Core Philosophy

1.  **Source-as-Registry:** The code lives in `registry/behaviors/` as real TypeScript files using **TypeBox** as the canonical schema definition. There is no separate "build" step for the registry itself.
2.  **Transformation-on-Install:** The CLI (`behavior-fn add`) is responsible for transforming the canonical TypeBox code into the user's preferred validator (Zod, Valibot, etc.) at installation time. This includes rewriting schema definitions and utility functions like `getObservedAttributes`.
3.  **Decoupled Logic:** Behaviors are standalone modules. They do not know about the consuming app's registry until wired up. They must be **headless** (no styles) and **framework-agnostic** (vanilla DOM/Web Components).
3.  **Type Safety:** Every behavior exports a Zod/TypeBox schema (`_behavior-definition.ts`) that drives runtime validation and TypeScript intellisense. **No `any`**.
4.  **Clean Code:** We adhere to strict coding standards. Code must be readable, maintainable, and testable.
5.  **Optimistic Concurrency:** We use a file-based locking mechanism in `TASKS.md` to manage work.

## Operational Rules

### 1. Environment & Branching

- **Working in Main:** You **MUST NOT** work directly in `main` for any code changes, refactors, or documentation updates. The `main` branch is **Strictly Read-Only** for code.
  - **Verification:** Always run `git branch --show-current` to confirm your branch. If it returns `main`, you must create a worktree or switch branches immediately.
  - **Exception:** You may commit directly to `main` ONLY when updating `TASKS.md` (e.g., locking a task `[-]` or marking it complete `[x]`) or creating new task files in `docs/tasks/`.
- **Task Isolation:** Every task **MUST** be executed in its own isolated environment (e.g., a `git worktree` or a dedicated feature branch).
- **Worktrees:** Prefer `git worktree` for parallel task execution to keep the environment clean.

### 2. The PDSRTDD Workflow

All code changes must follow the **PDSRTDD** flow. **Note:** The **Architect** is the sole owner of this workflow. One instance of the Architect handles the **Plan** phase (Task Creation). A **separate instance** of the Architect handles the **Execute** phase, delegating specific coding work to the Frontend or Infrastructure agents as needed.

1.  **P - Plan (Architect):** Analyze the requirements, define the Goal/Context, and create the task.
2.  **D - Data:** Define the data shapes and state requirements.
3.  **S - Schema:** Create the Zod/TypeBox schema in `_behavior-definition.ts`. This is the **Contract**.
4.  **R - Registry:** Register the behavior in `registry/behaviors-registry.json`.
5.  **T - Test:** Write tests in `behavior.test.ts`. **Tests must fail first** (Red).
6.  **DD - Develop:** Implement the logic in `behavior.ts` to make tests pass (Green).

**Approval Protocol:**
- **In Feature Branch/Worktree:** If you are NOT in `main` (verified via `git branch --show-current`), proceed with implementation immediately after creating the LOG.md. Do NOT stop for approval.
- **In Main:** Never implement in main (see Environment & Branching rules).

### 3. Coding Standards

- **TypeScript:** Strict mode enabled. No `any`. Use `unknown` and narrow types.
- **Behavior Naming:** Behaviors must be named in kebab-case (e.g., `reveal`, `input-watcher`).
- **Event Handling:** Behavior implementations must return an object with camelCase event handlers (e.g., `onCommand`, `onClick`, `onMouseEnter`) which are automatically wired up by the host using standard `addEventListener`.
- **Zod/TypeBox:** Use for all runtime validation.
- **No External Dependencies:** Behaviors should be dependency-free whenever possible.
- **Testing:** Use `vitest` and `jsdom`. Every behavior **MUST** have tests.
- **File Structure:**
  ```text
  registry/behaviors/<name>/
  ├── _behavior-definition.ts  # The Contract (Schema)
  ├── behavior.ts              # The Logic (Implementation)
  └── behavior.test.ts         # The Verification (Tests)
  ```

### 4. Git Protocol

- **HALT before Commit:** You **MUST** stop and report the branch name where the task was completed.
- **Explicit Push Only:** You **MUST NOT** push to remote unless the user explicitly requests it.
- **Review Changes:** Always present the changes (e.g., via `git status` or a summary) and wait for confirmation.

## Architectural Insights & Best Practices

1.  **Single Source of Truth (DRY):** Metadata (like `observedAttributes`) should be derived programmatically from the Schema (the Contract). Avoid manual duplication.
2.  **Standard Web APIs:** Prefer standard DOM mechanisms (Events, `addEventListener`, `MutationObserver`) over custom method delegation or proxies. This ensures better compatibility and standard behavior.
3.  **Test Harness Abstraction:** Centralize test host creation logic. Use helpers like `getObservedAttributes` to keep tests resilient to changes.
4.  **Type Safety:** Avoid `as any`. Use `keyof typeof` and proper type narrowing for dynamic property access to catch runtime errors early.

## Agent Roles

### 1. Architect Agent

- **Role:** Orchestrator, System Designer, Registry Guardian, **Task Planner & Task Executor**.
- **Focus:** High-level design, cross-cutting concerns, CLI architecture, **Task Creation (Plan) & Task Execution (Execute)**.
- **Prompt:** [docs/contributing/agent-prompts/architect.md](./docs/contributing/agent-prompts/architect.md)

### 2. Frontend Agent (Behavior Developer)

- **Role:** Behavior Implementer, DOM Specialist, **Specialist Sub-agent**.
- **Focus:** Writing `behavior.ts`, `_behavior-definition.ts`, and tests.
- **Prompt:** [docs/contributing/agent-prompts/frontend.md](./docs/contributing/agent-prompts/frontend.md)

### 3. Infrastructure Agent

- **Role:** Tooling Engineer, CLI Maintainer, **Specialist Sub-agent**.
- **Focus:** `index.ts`, `package.json`, build scripts, release workflow.
- **Prompt:** [docs/contributing/agent-prompts/infrastructure.md](./docs/contributing/agent-prompts/infrastructure.md)

## Task Management

- **Source of Truth:** `TASKS.md`.
- **Protocol:**
  1.  **Plan (Architect - Planning Instance):** Create Task -> Add to Backlog (`[ ]`).
  2.  **Execute (Architect - Execution Instance):** Read -> Lock (`[-]`) -> Execute -> Log -> Verify -> Complete (`[x]`).

## Documentation

- **Guides:** Check `docs/guides/` for specific implementation details.
- **Reference:** Check `docs/architecture/` for system design.
