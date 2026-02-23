# Behavior System Architecture

The `behavior-fn` library is a **distribution system** for a behavior-based architecture. It functions similarly to `shadcn-ui`, where instead of installing a monolithic npm package, you copy-paste (via CLI) only the behaviors you need into your project.

## The Architecture You Install

When you use `behavior-fn`, you are installing a **Registry Pattern** architecture into your application.

### 1. The Runtime Registry (`behavior-registry.ts`)

This file (installed as part of `core`) acts as the central hub for your application's behaviors.

- **Registration:** Behaviors register themselves here using `registerBehavior`.
- **Discovery:** Your application uses this registry to find and instantiate behaviors on DOM elements.
- **Type Safety:** It provides the types for `BehaviorFactory` and `BehaviorInstance`.

### 2. The Behavior Definition (`_behavior-definition.ts`)

Every behavior comes with a definition file that acts as its **Contract**.

- **Schema:** Defines the props the behavior accepts (validated at runtime or compile time).
- **Commands:** Defines the signals/commands the behavior responds to.
- **Events:** Defines the events the behavior emits.

### 3. The Implementation (`behavior.ts`)

This is the actual logic. It exports a factory function that takes an `HTMLElement` and returns a `BehaviorInstance`.

- **Scoped:** It validates that it is attached to the correct type of element.
- **Reactive:** It responds to prop changes and commands.

### 4. The Behavioral Host (`behavioral-host.ts`)

To use behaviors, an element must be upgraded to a **Behavioral Host**. This is handled by the `withBehaviors` mixin and the `defineBehavioralHost` utility.

- **`withBehaviors(Base)`**: A mixin that adds lifecycle management (`connectedCallback`, `disconnectedCallback`) and event delegation to any HTMLElement class.
- **`defineBehavioralHost(tagName, name?)`**: A utility to register a custom element that extends a native HTML tag and applies the mixin.

```typescript
import { defineBehavioralHost } from "~host";

// Registers <behavioral-div> extending HTMLDivElement
defineBehavioralHost("div");
```

## The Distribution System (`behavior-fn`)

The `behavior-fn` tool itself is a CLI that manages this architecture.

### Source-as-Registry

The `registry/` directory in the `behavior-fn` repository is the source of truth.

- **`registry/behaviors/`**: Contains the source code for all available behaviors.
- **`registry/behaviors-registry.json`**: A manifest file that maps behavior names to their file paths and dependencies.

### How it Works

1.  **Init:** `npx behavior-fn init` sets up the `core` files (`behavior-registry.ts`, `behavior-utils.ts`) in your project.
2.  **Add:** `npx behavior-fn add <name>` looks up the behavior in `behaviors-registry.json`, reads the files from the source registry, rewrites imports to match your project's aliases, and writes them to your disk.

This approach gives you full ownership of the code. You can modify the installed behaviors to fit your specific needs without fighting a library's abstraction.

## Platform Integration System

The CLI uses a **Strategy Pattern** for platform-specific code transformations, allowing seamless integration with different frameworks without modifying core logic.

### Platform Detection & Validation

When you run `behavior-fn init` or `behavior-fn add`, the CLI automatically:

1. **Detects** your platform (Astro, Next.js, Remix, etc.) by checking for config files
2. **Validates** that the platform is properly installed
3. **Applies** platform-specific transformations during behavior installation

### Validator Strategy System

The CLI also supports multiple schema validators (Zod, Valibot, TypeBox, ArkType, Zod Mini) through a similar strategy pattern:

1. **Detection**: Scans `package.json` for installed validators
2. **Transformation**: Converts TypeBox schemas (canonical format) to your preferred validator
3. **Optimization**: Generates validator-specific utility functions

### Extensibility

Both the Platform and Validator systems are designed to be extended without modifying core CLI code:

- **Adding Platforms**: Implement `PlatformStrategy` interface (see `docs/guides/creating-platforms.md`)
- **Adding Validators**: Implement `ValidatorStrategy` interface (see `src/strategies/`)

This architecture follows the **Open-Closed Principle**: open for extension, closed for modification.
