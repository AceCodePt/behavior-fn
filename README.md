# BehaviorCN

A collection of copy-pasteable, type-safe behavior modules for modern web applications.

## Philosophy

1.  **Owned Code:** Don't install a library. Copy the behavior into your project.
2.  **Decoupled Logic:** Behaviors are standalone modules that don't know about your app's registry until you wire them up.
3.  **Type Safe:** Every behavior exports a Zod schema (`_behavior-definition.ts`) that drives runtime validation and TypeScript intellisense.
4.  **Headless:** Logic only. No styles.

## Installation

The CLI tool automates the process of fetching behaviors and placing them in your project.

### 1. Initialize

Run this command to install the core infrastructure (`behavior-registry.ts`, `_registry-core.ts`).

```bash
npx tsx ../behavior-cn/index.ts init
```

### 2. Setting up Behavioral Hosts

To use behaviors on standard HTML elements, you must register them as behavioral hosts. This extends the native element with the behavior system capabilities.

```typescript
import { defineBehavioralHost } from "./registry/behavioral-host";

// Registers 'behavioral-button' extending HTMLButtonElement
defineBehavioralHost("button");

// Registers 'behavioral-div' extending HTMLDivElement
defineBehavioralHost("div");
```

This is required to use behaviors on these elements.

### 3. Add a Behavior

Run this command to fetch a specific behavior module (e.g., `reveal`).

```bash
npx tsx ../behavior-cn/index.ts add reveal
```

This will:

1.  Download the behavior files to `src/components/html/behaviors/reveal/`.
2.  Install any necessary dependencies (if any).
3.  **Auto-wire the logic:** The `behavior-registry.ts` (installed during init) automatically finds and registers the implementation.

## Usage

### 1. Setup Hosts

Import `defineBehavioralHost` and register elements (e.g., `button`, `div`).

```typescript
import { defineBehavioralHost } from "./registry/behavioral-host";

defineBehavioralHost("button");
defineBehavioralHost("div");
```

### 2. Register Behavior

Import `registerBehavior` and the behavior factory, then register it.

```typescript
import { registerBehavior } from "./registry/behavior-registry";
import { RevealBehavior } from "./behaviors/reveal/behavior";

registerBehavior("reveal", RevealBehavior);
```

### 3. Use in HTML

```html
<button is="behavioral-button" behavior="reveal">Click me</button>
```

## Creating a New Behavior

To contribute a new behavior to this repository:

1.  **Naming:** Use kebab-case (e.g., `reveal`).
2.  Create a folder in `registry/behaviors/<name>/`.
3.  Add `_behavior-definition.ts` (the contract).
4.  Add `behavior.ts` (the logic).
5.  Add `behavior.test.ts` (the tests).
6.  Add an entry to `registry/behaviors-registry.json`.
