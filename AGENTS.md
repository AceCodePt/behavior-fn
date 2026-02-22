# BehaviorCN Agents Guide

Welcome to **BehaviorCN**. This repository is the **Source of Truth** for the "Behavior UI" library—a headless, type-safe, and registry-based collection of behavioral mixins for Web Components.

## Core Philosophy

1.  **Source-as-Registry:** The code lives in `registry/behaviors/` as real TypeScript files. There is no separate "build" step that transforms them into a different format for consumption. The source _is_ the distribution.
2.  **Decoupled Logic:** Behaviors are standalone modules. They do not know about the consuming app's registry until wired up. They must be **headless** (no styles) and **framework-agnostic** (vanilla DOM/Web Components).
3.  **Type Safety:** Every behavior exports a Zod/TypeBox schema (`_behavior-definition.ts`) that drives runtime validation and TypeScript intellisense. **No `any`**.
4.  **Clean Code:** We adhere to strict coding standards. Code must be readable, maintainable, and testable.
5.  **Optimistic Concurrency:** We use a file-based locking mechanism in `TASKS.md` to manage work.

## Operational Rules

### 1. Environment & Branching

- **Working in Main:** Unlike other strict environments, you **ARE ALLOWED** to work directly in the `main` branch for small fixes, documentation, or when explicitly instructed.
- **Feature Branches:** For complex features or new behaviors, prefer creating a feature branch (e.g., `feature/my-behavior`) to keep the history clean.
- **Worktrees:** Use `git worktree` if you need to parallelize tasks, but it is not strictly required for every single operation.

### 2. The PDSRTDD Workflow

All code changes must follow the **PDSRTDD** flow:

1.  **P - Plan:** Analyze the requirements. Decide if it's a **Behavior** (capability) or a **Web Component** (identity).
2.  **D - Data:** Define the data shapes and state requirements.
3.  **S - Schema:** Create the Zod/TypeBox schema in `_behavior-definition.ts`. This is the **Contract**.
4.  **R - Registry:** Register the behavior in `registry/behaviors-registry.json`.
5.  **T - Test:** Write tests in `behavior.test.ts`. **Tests must fail first** (Red).
6.  **DD - Develop:** Implement the logic in `behavior.ts` to make tests pass (Green).

### 3. Coding Standards

- **TypeScript:** Strict mode enabled. No `any`. Use `unknown` and narrow types.
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

## Agent Roles

### 1. Architect Agent

- **Role:** Orchestrator, System Designer, Registry Guardian.
- **Focus:** High-level design, cross-cutting concerns, CLI architecture.
- **Prompt:** [docs/contributing/agent-prompts/architect.md](./docs/contributing/agent-prompts/architect.md)

### 2. Frontend Agent (Behavior Developer)

- **Role:** Behavior Implementer, DOM Specialist.
- **Focus:** Writing `behavior.ts`, `_behavior-definition.ts`, and tests.
- **Prompt:** [docs/contributing/agent-prompts/frontend.md](./docs/contributing/agent-prompts/frontend.md)

### 3. Infrastructure Agent

- **Role:** Tooling Engineer, CLI Maintainer.
- **Focus:** `index.ts`, `package.json`, build scripts, release workflow.
- **Prompt:** [docs/contributing/agent-prompts/infrastructure.md](./docs/contributing/agent-prompts/infrastructure.md)

## Task Management

- **Source of Truth:** `TASKS.md`.
- **Protocol:** Read -> Lock (`[-]`) -> Execute -> Log -> Verify -> Complete (`[x]`).

## Documentation

- **Guides:** Check `docs/guides/` for specific implementation details.
- **Reference:** Check `docs/architecture/` for system design.
