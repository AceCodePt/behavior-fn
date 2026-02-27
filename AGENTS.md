# BehaviorFN Agents Guide

Welcome to **BehaviorFN**. This repository is the **Source of Truth** for the "Behavior UI" library—a headless, type-safe, and registry-based collection of behavioral mixins for Web Components.

## Core Philosophy

1.  **Source-as-Registry:** The code lives in `registry/behaviors/` as real TypeScript files using **TypeBox** as the canonical schema definition. There is no separate "build" step for the registry itself.
2.  **Transformation-on-Install:** The CLI (`behavior-fn add`) is responsible for transforming the canonical TypeBox code into the user's preferred validator (Zod, Valibot, etc.) at installation time. This includes rewriting schema definitions and utility functions like `getObservedAttributes`.
3.  **Decoupled Logic:** Behaviors are standalone modules. They do not know about the consuming app's registry until wired up. They must be **headless** (no styles) and **framework-agnostic** (vanilla DOM/Web Components).
4.  **Type Safety:** Every behavior exports a Zod/TypeBox schema (`_behavior-definition.ts`) that drives runtime validation and TypeScript intellisense. **No `any`**.
5.  **Clean Code:** We adhere to strict coding standards. Code must be readable, maintainable, and testable.
6.  **Optimistic Concurrency:** We use a file-based locking mechanism in `TASKS.md` to manage work.

## Fundamental Principles

### 1. Single Source of Truth (Ultimate DRY)

**All types must be derived from data, never manually defined.**

When you have data structures (like validators or platforms), the types should be extracted from those structures, not duplicated:

```typescript
// ❌ BAD: Manual type definition (duplication)
export type ValidatorName = "zod" | "valibot" | "arktype" | "typebox" | "zod-mini";
export const validators = { "zod": zodValidator, "valibot": valibotValidator, ... };

// ✅ GOOD: Type derived from data
export const validators = [zodValidator, valibotValidator, ...] as const;
export type PackageName = (typeof validators)[number]["packageName"];
// Extracts: "zod" | "valibot" | "arktype" | "@sinclair/typebox" | "zod-mini"
```

**Benefits:**
- Add a validator → types update automatically
- No manual synchronization needed
- Impossible for types to drift from implementation
- TypeScript infers literal types automatically

**Application:** This principle applies to validators, platforms, package managers, and any registry-like structure.

### 2. Readonly Metadata with Literal Types

**All metadata fields that shouldn't change must be `readonly` with literal type inference.**

```typescript
// ❌ BAD: Mutable fields, widened types
export class ZodValidator {
  packageName: string = "zod"; // Type: string (too wide)
  label: string = "Zod";       // Type: string (too wide)
}

// ✅ GOOD: Readonly fields, literal types
export class ZodValidator {
  readonly packageName = "zod"; // Type: "zod" (literal)
  readonly label = "Zod";       // Type: "Zod" (literal)
}
```

**Benefits:**
- Immutability enforced at compile time
- Literal types enable precise type inference
- Better autocomplete and type safety
- Self-documenting code

### 3. Export Singleton Instances

**Create instances once, export them, and reuse everywhere.**

```typescript
// ❌ BAD: Creating instances multiple times
// validators/index.ts
const validators = [new ZodValidator(), ...];

// detect-validator.ts
const zodValidator = validators.find(v => v.packageName === "zod");

// ✅ GOOD: Export singletons, import where needed
// validators/index.ts
export const zodValidator = new ZodValidator();
export const validators = [zodValidator, ...] as const;

// detect-validator.ts
import { zodValidator } from "../validators/index";
```

**Benefits:**
- True singleton pattern
- Memory efficient
- No runtime searches needed
- Clear dependencies

### 4. Use Natural Keys, Not Surrogate Keys

**Never use arbitrary numeric IDs when a natural unique identifier exists. Use self-documenting keys.**

```typescript
// ❌ BAD: Arbitrary numeric IDs (surrogate keys)
export interface Validator {
  readonly id: number;  // 0, 1, 2 - what do these mean?
  readonly packageName: string;
}

getValidator(0);  // What validator is 0?

// ✅ GOOD: Natural keys (package name is already unique)
export interface Validator {
  readonly packageName: string;  // This IS the unique identifier
  readonly label: string;
}

getValidator("zod");  // Clear and explicit!

// ✅ GOOD: Use values from actual instances, not magic strings
import { zodValidator, zodMiniValidator } from "../validators/index";

if (allDeps["zod"]) {
  detectedValidators.push(zodValidator.packageName);
  detectedValidators.push(zodMiniValidator.packageName);
}
```

**Benefits:**
- Self-documenting code (no need to look up what `0` means)
- Single source of truth
- Refactoring-safe (no need to maintain ID sequences)
- No magic numbers or arbitrary mappings
- JSON configs are readable: `"validator": "zod"` vs `"validator": 0`

### 5. Type-Safe Registry Pattern

**Use arrays with `as const` for registries, derive types from them.**

```typescript
// Complete pattern for a registry:

// 1. Define interface with readonly metadata using natural keys
export interface Validator {
  readonly packageName: string;  // This is the natural unique identifier
  readonly label: string;
  // ... methods
}

// 2. Implement with literal values
export class ZodValidator implements Validator {
  readonly packageName = "zod";
  readonly label = "Zod";
}

// 3. Export singleton instances
export const zodValidator = new ZodValidator();
export const valibotValidator = new ValibotValidator();
// ... export all instances

// 4. Create typed array registry
export const validators = [zodValidator, valibotValidator, ...] as const;

// 5. Derive types from the registry
export type PackageName = (typeof validators)[number]["packageName"];
// Extracts: "zod" | "valibot" | "arktype" | "@sinclair/typebox" | "zod-mini"

// 6. Type-safe lookup function using natural key
export function getValidator(packageName: string): Validator {
  const validator = validators.find(v => v.packageName === packageName.toLowerCase());
  if (!validator) throw new Error(`Validator "${packageName}" not found`);
  return validator;
}

// 7. Type-safe validation helper
export function isValidValidator(packageName: string): packageName is PackageName {
  return validators.some(v => v.packageName === packageName.toLowerCase());
}
```

**This pattern ensures:**
- Complete type safety
- No manual type maintenance
- Easy to extend (just add a new class)
- Compile-time guarantees
- Self-documenting code (no arbitrary IDs)

### 6. Data-First Design

**Define data structures first, then derive everything from them.**

```typescript
// ❌ BAD: Separate type definitions
export type PackageManager = "pnpm" | "bun" | "npm" | "yarn";

export function detectPackageManager(cwd: string): PackageManager {
  const lockfiles = [
    { file: "pnpm-lock.yaml", pm: "pnpm" as const },
    { file: "bun.lockb", pm: "bun" as const },
    // ...
  ];
  // ...
}

// ✅ GOOD: Data-first approach
export const packageManagers = [
  { lockfile: "pnpm-lock.yaml", name: "pnpm" },
  { lockfile: "bun.lockb", name: "bun" },
  { lockfile: "package-lock.json", name: "npm" },
  { lockfile: "yarn.lock", name: "yarn" },
] as const;

// Type derived from data
export type PackageManager = (typeof packageManagers)[number]["name"];

export function detectPackageManager(cwd: string): PackageManager {
  for (const { lockfile, name } of packageManagers) {
    if (fs.existsSync(path.join(cwd, lockfile))) {
      return name;
    }
  }
  return "npm";
}
```

**Benefits:**
- Single source of truth for lockfile mappings
- Add a package manager → type updates automatically
- Easy to iterate over data programmatically
- No duplication between data and types

### 7. Infer Types from Functions

**Derive types from function return types instead of manually defining interfaces.**

```typescript
// ❌ BAD: Manual interface definition
export interface DetectionResult {
  typescript: boolean;
  packageManager: PackageManager;
  hasSrc: boolean;
  hasLib: boolean;
  suggestedPath: string;
}

export function detectEnvironment(cwd: string): DetectionResult {
  return {
    typescript: detectTypeScript(cwd),
    packageManager: detectPackageManager(cwd),
    // ...
  };
}

// ✅ GOOD: Type inferred from function
export function detectEnvironment(cwd: string) {
  return {
    typescript: detectTypeScript(cwd),
    packageManager: detectPackageManager(cwd),
    hasSrc: fs.existsSync(path.join(cwd, "src")),
    hasLib: fs.existsSync(path.join(cwd, "lib")),
    suggestedPath: /* ... */,
  };
}

// Type derived from implementation
export type DetectionResult = ReturnType<typeof detectEnvironment>;
```

**Benefits:**
- Implementation IS the source of truth
- Type automatically stays in sync with code
- One less thing to maintain manually
- Refactoring-safe (change return → type updates)

### 8. Behavior Definition Standard

**All behaviors MUST follow the canonical definition pattern** where the schema is the single source of truth and `uniqueBehaviorDef` auto-extracts metadata.

For complete details, see: **[docs/guides/behavior-definition-standard.md](./docs/guides/behavior-definition-standard.md)**

**Core Pattern: Key-Value Identity**

Attribute and command names follow the pattern where **key === value**:

```typescript
// Auto-extracted by uniqueBehaviorDef:
attributes = {
  "reveal-delay": "reveal-delay",
  "reveal-duration": "reveal-duration",
}

commands = {
  "--show": "--show",
  "--hide": "--hide",
}
```

**File Structure (4 files per behavior):**

```
behavior-name/
├── schema.ts                 # Literal string keys define attributes
├── _behavior-definition.ts   # uniqueBehaviorDef auto-extracts metadata
├── behavior.ts               # Access via definition.attributes, definition.commands
└── behavior.test.ts          # Tests
```

**schema.ts** - Define attributes as literal keys:

```typescript
import { Type } from "@sinclair/typebox";

export const schema = Type.Object({
  /** Delay before revealing */
  "reveal-delay": Type.Optional(Type.String()),
  
  /** Duration of reveal animation */
  "reveal-duration": Type.Optional(Type.String()),
});
```

**_behavior-definition.ts** - Auto-extract metadata:

```typescript
import { uniqueBehaviorDef } from "~utils";
import { schema } from "./schema";

const definition = uniqueBehaviorDef({
  name: "reveal",
  schema,  // attributes auto-extracted from schema keys
  commands: {
    "--show": "--show",
    "--hide": "--hide",
  },
});

export default definition;
```

**behavior.ts** - Access via definition object:

```typescript
import definition from "./_behavior-definition";

const { attributes, commands } = definition;

export const revealBehaviorFactory = (el: HTMLElement) => {
  // ✅ Access using bracket notation
  const delay = el.getAttribute(attributes["reveal-delay"]);
  
  return {
    onCommand(e: CommandEvent<string>) {
      if (!commands) return;
      
      if (e.command === commands["--show"]) {
        // Handle command
      }
    },
  };
};
```

**Attribute Naming Convention:**

Every behavior-specific attribute MUST follow: `{behavior-name}-{attribute-name}`

Examples:
- ✅ `reveal-delay`, `reveal-duration`, `reveal-anchor`
- ✅ `compute-formula`
- ✅ `request-url`, `request-method`, `request-trigger`
- ✅ `input-watcher-target`, `input-watcher-format`

**Command Naming Convention:**

All commands MUST use double-dash prefix: `--{command-name}`

Examples:
- ✅ `--show`, `--hide`, `--toggle`
- ✅ `--trigger`, `--close-sse`

**Benefits:**
- ✅ Schema is single source of truth
- ✅ Strong literal types: `attributes["reveal-delay"]` has type `"reveal-delay"`
- ✅ No manual duplication (DRY)
- ✅ Auto-extracted metadata (attributes, commands from definition)
- ✅ Runtime validation ensures key-value identity
- ✅ Type-safe attribute access throughout

## Operational Rules

### 1. Environment & Branching

- **Working in Main:** You **MUST NOT** work directly in `main` for any code changes, refactors, or documentation updates. The `main` branch is **Strictly Read-Only** for code.
  - **Verification:** Always run `git branch --show-current` to confirm your branch. If it returns `main`, you must create a worktree or switch branches immediately.
  - **Exception:** You may commit directly to `main` ONLY when updating `TASKS.md` (e.g., locking a task `[-]` or marking it complete `[x]`) or creating new task files in `docs/tasks/`.
- **Task Isolation:** Every task **MUST** be executed in its own isolated environment (e.g., a `git worktree` or a dedicated feature branch).
- **Worktrees:** Prefer `git worktree` for parallel task execution to keep the environment clean.

### 2. The PDSRTDD Workflow

All code changes must follow the **PDSRTDD** flow. **Note:** The **Architect** is the sole owner of this workflow. One instance of the Architect handles the **Plan** phase (Task Creation). A **separate instance** of the Architect handles the **Execute** phase, delegating specific coding work to the Frontend or Infrastructure agents as needed.

1.  **P - Plan (Architect):** Analyze the requirements, define the Goal/Context, and create the task with a detailed `LOG.md` in the task directory. **Since work is done in isolated branches/worktrees (not `main`), no approval is needed after planning—proceed directly to execution.**
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
- **Invoker Commands API:** We use the native **Invoker Commands API** (`commandfor` and `command` attributes) for declarative button controls. Trigger buttons do NOT need the `is` attribute—only elements with `behavior` attributes need `is` based on their behaviors.
  ```html
  <!-- Trigger (uses Invoker Commands - no is needed) -->
  <button commandfor="modal" command="--toggle">Open</button>
  
  <!-- Target (has behavior - needs is="behavioral-{behavior-names}") -->
  <dialog is="behavioral-reveal" id="modal" behavior="reveal">Content</dialog>
  ```
- **Behavioral Hosts:** Only elements with the `behavior` attribute require the `is` attribute to activate behavior loading. The `is` value is `behavioral-{sorted-behavior-names}`:
  - Single: `behavior="reveal"` → `is="behavioral-reveal"`
  - Multiple: `behavior="reveal logger"` → `is="behavioral-logger-reveal"` (sorted alphabetically)
  - Without the `is` attribute, behaviors will not load.
- **Zod/TypeBox:** Use for all runtime validation.
- **No External Dependencies:** Behaviors should be dependency-free whenever possible.
- **Testing:** Use `vitest` and `jsdom`. Every behavior **MUST** have tests.
- **Breaking Changes:** We are in **beta** (pre-1.0). Breaking changes are acceptable and encouraged when they:
  - Fix architectural issues
  - Establish better patterns
  - Improve consistency across the codebase
  - Enhance type safety or DX
  - **Do NOT hesitate to break APIs if it makes the codebase better.** Document migrations for users, but prioritize correctness over backward compatibility.
- **File Structure:** Every behavior MUST follow this exact 4-file structure:
  ```text
  registry/behaviors/<name>/
  ├── _behavior-definition.ts  # The Contract (name + schema + commands)
  ├── schema.ts                # TypeBox schema definition
  ├── behavior.ts              # The Logic (factory function)
  └── behavior.test.ts         # The Verification (tests)
  ```
  
  **CRITICAL:** Do NOT create flat files in `registry/behaviors/` root (e.g., `my-behavior.ts`). Always create a directory with these 4 files, even if the behavior seems like "infrastructure" or a "polyfill". If you're adding capability to elements, it's a behavior and needs this structure.
  
  **Example Mistake to Avoid:**
  ```text
  ❌ registry/behaviors/my-feature.ts
  ❌ registry/behaviors/my-feature.test.ts
  
  ✅ registry/behaviors/my-feature/
     ├── _behavior-definition.ts
     ├── schema.ts
     ├── behavior.ts
     └── behavior.test.ts
  ```

### 4. Git Protocol

- **HALT before Commit:** You **MUST** stop and report the branch name where the task was completed.
- **Explicit Push Only:** You **MUST NOT** push to remote unless the user explicitly requests it.
- **Review Changes:** Always present the changes (e.g., via `git status` or a summary) and wait for confirmation.

## Architectural Insights & Best Practices

1.  **Single Source of Truth (DRY):** Metadata (like `observedAttributes`) should be derived programmatically from the Schema (the Contract). Avoid manual duplication.
2.  **Standard Web APIs:** Prefer standard DOM mechanisms (Events, `addEventListener`, `MutationObserver`) over custom method delegation or proxies. This ensures better compatibility and standard behavior.
3.  **Invoker Commands API:** We leverage the native **Invoker Commands API** for semi-interactivity. This is a web standard that provides declarative control over interactive elements using `commandfor` and `command` attributes. Benefits:
    - **Zero JavaScript Required:** Buttons can control behaviors declaratively
    - **Built-in Accessibility:** ARIA attributes are automatically managed
    - **Standard Behavior:** Works with native browser features (dialogs, popovers)
    - **Clear Separation:** Triggers (with `commandfor`) vs. Targets (with `behavior`)
4.  **Behavioral Host Activation:** The `is` attribute is **required** for behavior loading. Only elements with the `behavior` attribute need `is` based on their behaviors. The `is` value format is `behavioral-{sorted-behavior-names}`. For example:
    - `behavior="reveal"` → `is="behavioral-reveal"`
    - `behavior="reveal logger"` → `is="behavioral-logger-reveal"` (sorted alphabetically)
    - Trigger elements using the Invoker Commands API do NOT need the `is` attribute.
5.  **Test Harness Abstraction:** Centralize test host creation logic. Use helpers like `getObservedAttributes` to keep tests resilient to changes.
6.  **Type Safety:** Avoid `as any`. Use `keyof typeof` and proper type narrowing for dynamic property access to catch runtime errors early.

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
