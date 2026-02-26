# Architecture Documentation

This section contains architectural documentation for BehaviorFN's core systems and design decisions.

## 📐 Core Architecture

### [Behavior System](./behavior-system.md)
The foundational architecture of the behavior system:
- Behavior lifecycle and registration
- Behavioral Host pattern
- Registry architecture
- Composition model

### [Command Protocol](./command-protocol.md)
The event-based command system:
- Invoker Commands API integration
- Command event structure
- Command dispatch and handling
- Event bubbling patterns

### [Reactive Protocol](./reactive-protocol.md)
Reactive patterns for data-driven behaviors:
- Observable attributes
- Data binding patterns
- State synchronization
- Reactive updates

## 🏗️ Build System

### [Why Jiti](./why-jiti.md)
Build system architecture and decisions:
- TypeScript execution at build time
- Dynamic imports in build scripts
- Schema transformation pipeline

## 📋 Architecture Decisions

This directory also contains Architecture Decision Records (ADRs) in the `decisions/` subdirectory documenting key architectural choices.

## 🎯 Key Principles

### 1. **Source as Registry**
The behavior code IS the registry. No separate build step for registry files.

### 2. **ESM-Only Architecture**
- No IIFE bundles
- No window globals for state
- True ES module sharing
- Singleton patterns via modules

### 3. **Transformation on Install**
The CLI transforms behaviors from canonical TypeBox to user's preferred validator at install time.

### 4. **Type Safety First**
- All behaviors have schemas
- Runtime validation
- TypeScript inference from schemas
- No `any` types

### 5. **Headless & Framework-Agnostic**
- No styles
- No framework dependencies
- Pure DOM/Web Components
- Standard Web APIs

## 🔄 System Flow

```
1. Behavior Definition (TypeBox Schema)
   ↓
2. Registration (ESM Module Registry)
   ↓
3. Element with behavior attribute
   ↓
4. Auto-Loader or Explicit Host Definition
   ↓
5. Behavioral Host Custom Element
   ↓
6. Behavior Factory Instantiation
   ↓
7. Lifecycle Methods & Event Handlers
```

## 📦 Module Structure

```
registry/
├── behaviors/
│   ├── behavior-registry.ts      # Core registry
│   ├── behavioral-host.ts        # Custom element host
│   ├── behavior-utils.ts         # Utilities
│   ├── auto-loader.ts           # Auto-loader
│   └── [behavior-name]/         # Individual behaviors
│       ├── _behavior-definition.ts
│       ├── schema.ts
│       ├── behavior.ts
│       └── behavior.test.ts
```

## 🔗 Related Documentation

- [Behavior Definition Standard](../guides/behavior-definition-standard.md) - The contract for behaviors
- [Type-Safe Registries](../guides/type-safe-registries.md) - Registry patterns
- [Testing Behaviors](../guides/testing-behaviors.md) - Testing architecture
- [AGENTS.md](../../AGENTS.md) - Development principles

## 🎓 Understanding the Architecture

### For New Contributors
1. Start with [Behavior System](./behavior-system.md)
2. Read [Command Protocol](./command-protocol.md)
3. Review [Behavior Definition Standard](../guides/behavior-definition-standard.md)

### For System Designers
1. Review all architecture documents
2. Check [Architecture Decisions](./decisions/)
3. Study [AGENTS.md](../../AGENTS.md) principles

### For Implementers
1. Understand [Reactive Protocol](./reactive-protocol.md)
2. Study behavior implementations in `registry/behaviors/`
3. Review tests for patterns

---

**Last updated:** 2026-02-26
