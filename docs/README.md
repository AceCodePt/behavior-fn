# BehaviorFN Documentation

Welcome to the **BehaviorFN** documentation! This is a headless, type-safe, and registry-based library for behavioral mixins for Web Components.

## 📚 Documentation Structure

### [Architecture](./architecture/README.md)
System design, core concepts, and architectural decisions.

### [Guides](./guides/README.md)
Step-by-step guides for common tasks and patterns.

### [Contributing](./contributing/README.md)
How to contribute to BehaviorFN, including behavior creation and agent workflows.

### [Tasks](./tasks/README.md)
Development tasks, planning documents, and work logs.

### [Templates](./templates/README.md)
Templates for creating new tasks, behaviors, and documentation.

## 🚀 Quick Start

### For Users
1. **[Using Behaviors](./guides/using-behaviors.md)** - Get started with BehaviorFN
2. **[CDN Usage](./guides/cdn-usage.md)** - Load behaviors via CDN
3. **[Auto-Loader](./guides/auto-loader.md)** - Automatic behavior loading

### For Contributors
1. **[Adding Behaviors](./contributing/adding-behaviors.md)** - Create new behaviors
2. **[Behavior Definition Standard](./guides/behavior-definition-standard.md)** - The contract
3. **[Testing Behaviors](./guides/testing-behaviors.md)** - Write tests

### For Architects
1. **[Behavior System](./architecture/behavior-system.md)** - Core architecture
2. **[Command Protocol](./architecture/command-protocol.md)** - Event system
3. **[Agent Prompts](./contributing/agent-prompts/)** - AI agent instructions

## 🏗️ Core Concepts

### Behaviors
Behaviors are composable units of functionality that can be attached to HTML elements using the `behavior` attribute:

```html
<dialog behavior="reveal" id="modal">
  Content
</dialog>
```

### Registry
All behaviors are registered in an ESM module registry (no global state):

```typescript
import { registerBehavior, getBehaviorDef } from 'behavior-fn-core';

const definition = { name: 'my-behavior', schema: { ... } };
registerBehavior(definition, myBehaviorFactory);
```

### Type Safety
Every behavior has a TypeBox/Zod schema that drives runtime validation and TypeScript types.

## 📖 Key Documents

| Document | Description |
|----------|-------------|
| [Behavior Definition Standard](./guides/behavior-definition-standard.md) | **Required reading** - The contract for all behaviors |
| [Behavior System Architecture](./architecture/behavior-system.md) | Core system design |
| [AGENTS.md](../AGENTS.md) | Development workflow and principles |

## 🔍 Finding What You Need

- **Learning BehaviorFN?** Start with [Using Behaviors](./guides/using-behaviors.md)
- **Adding a behavior?** Read [Behavior Definition Standard](./guides/behavior-definition-standard.md)
- **Understanding the system?** Check [Architecture docs](./architecture/README.md)
- **Contributing code?** See [Contributing guides](./contributing/README.md)
- **Looking for a specific topic?** Use the search in your editor or browser

## 🤝 Contributing

See [Contributing Documentation](./contributing/README.md) for guidelines on adding or improving documentation.

## 📝 Documentation Standards

When creating or updating documentation:

1. **Clear Examples** - Always include working code examples
2. **Current API** - Use the latest API signatures
3. **Cross-References** - Link to related documents
4. **Update Index** - Add new docs to relevant README.md files
5. **Test Examples** - Verify code examples work

## 🏷️ Version

Documentation version: **0.2.0** (Beta)  
Last updated: **2026-02-26**

---

**Need help?** Check the [guides](./guides/README.md) or open an issue on GitHub.
