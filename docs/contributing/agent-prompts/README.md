# Agent Prompts

This directory contains specialized prompts for AI agents working on BehaviorFN.

## 🤖 Agent Roles

### [Architect Agent](./architect.md)
**Role:** Orchestrator, System Designer, Registry Guardian, Task Planner & Executor

**Responsibilities:**
- System architecture and design decisions
- Cross-cutting concerns
- CLI architecture
- Task creation (Plan phase)
- Task execution (Execute phase)
- Delegates to Frontend/Infrastructure agents

**When to use:** Complex architectural changes, system-wide refactoring, task orchestration

### Frontend Agent (Behavior Developer)
**Role:** Behavior Implementer, DOM Specialist

**Responsibilities:**
- Writing `behavior.ts` implementations
- Creating `_behavior-definition.ts`
- Writing behavior tests
- DOM manipulation
- Event handling

**When to use:** Creating or modifying individual behaviors

### Infrastructure Agent
**Role:** Tooling Engineer, CLI Maintainer

**Responsibilities:**
- `index.ts` and CLI commands
- `package.json` and dependencies
- Build scripts and tooling
- Release workflows
- CI/CD pipelines

**When to use:** Build system changes, CLI modifications, release processes

## 📋 Agent Workflow

### PDSRTDD Process

All agents follow the **PDSRTDD** workflow:

1. **P - Plan (Architect):** Create task with LOG.md
2. **D - Data:** Define data shapes and state requirements  
3. **S - Schema:** Create TypeBox schema (the contract)
4. **R - Registry:** Register behavior if needed
5. **T - Test:** Write failing tests (Red)
6. **DD - Develop:** Implement to pass tests (Green)

### Task Management

**Architect creates tasks:**
```
docs/tasks/YYYYMMDD-HHMMSS-task-name/
├── TASK.md   # Requirements, context, acceptance criteria
└── LOG.md    # Progress log
```

**Execution flow:**
1. Architect locks task: `[-]` in TASKS.md
2. Architect executes or delegates to specialist agent
3. Agent implements and logs progress
4. Tests verify implementation
5. Architect marks complete: `[x]` in TASKS.md

## 🔒 Critical Rules

### Environment & Branching
- **NEVER work directly on main** (except TASKS.md updates)
- Always verify branch with `git branch --show-current`
- Use git worktrees for parallel tasks
- Each task in isolated environment

### Git Protocol
- **HALT before commit** - Report branch name first
- **Explicit push only** - Never push without user request
- Present changes before committing
- Wait for user confirmation

### Approval Protocol
- **In feature branch:** Proceed after creating LOG.md
- **In main:** Never implement code changes

## 📖 Key Documents

All agents must understand:
- **[AGENTS.md](../../../AGENTS.md)** - Complete agent instructions
- **[Behavior Definition Standard](../../guides/behavior-definition-standard.md)** - Behavior contract
- **[Architecture docs](../../architecture/README.md)** - System design

## 🎯 Coding Standards

### TypeScript
- Strict mode, no `any`
- Explicit return types
- camelCase for functions
- PascalCase for types

### Behaviors
- Kebab-case names (`reveal`, `input-watcher`)
- camelCase event handlers (`onCommand`, `onClick`)
- 4-file structure (definition, schema, behavior, test)

### Testing
- All behaviors **must** have tests
- Use Vitest + JSDOM
- Test-driven development (Red-Green)

## 🚨 Breaking Changes

We are in **beta** (pre-1.0). Breaking changes are acceptable when they:
- Fix architectural issues
- Establish better patterns
- Improve consistency
- Enhance type safety or DX

**Do NOT hesitate** to break APIs if it makes the codebase better.

## 🏗️ Architectural Principles

From AGENTS.md:

1. **Single Source of Truth** - Ultimate DRY, derive all types from data
2. **Readonly Metadata** - Immutable with literal types
3. **Export Singletons** - Create once, use everywhere
4. **Natural Keys** - Self-documenting identifiers
5. **Type-Safe Registry** - Arrays with `as const`
6. **Data-First Design** - Define data structures first

## 🤝 Agent Collaboration

### When Architect delegates:
```
Architect: "I need a new json-template feature implemented"
  ↓
Frontend Agent: Implements behavior.ts and tests
  ↓
Architect: Reviews and integrates
```

### When Infrastructure work needed:
```
Architect: "We need to update the CDN build"
  ↓
Infrastructure Agent: Updates build-cdn.ts
  ↓
Architect: Verifies output and tests
```

## 📝 Communication Standards

### For Architect
- Create detailed task specs
- Clear acceptance criteria
- Delegate appropriately
- Review all changes

### For Specialist Agents
- Follow task requirements exactly
- Log progress clearly
- Ask for clarification if needed
- Deliver complete, tested code

## 🔗 External Resources

- [AGENTS.md](../../../AGENTS.md) - Full agent instructions
- [TASKS.md](../../../TASKS.md) - Active task list
- [docs/tasks/](../../tasks/) - All task specs

---

**Agent onboarding:** Read your specific agent prompt file, then review AGENTS.md.

**Last updated:** 2026-02-26
