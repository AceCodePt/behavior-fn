# Contributing

Welcome to the BehaviorFN contributor documentation! Thank you for your interest in contributing.

## 📋 Getting Started

### [Adding Behaviors](./adding-behaviors.md)
Complete guide to creating and contributing new behaviors.
- Behavior structure
- PDSRTDD workflow
- Testing requirements
- Submission process

### [Agent Prompts](./agent-prompts/README.md)
Instructions for AI agents working on BehaviorFN.
- Architect agent role
- Frontend agent role
- Infrastructure agent role
- Task management protocol

## 🎯 Contribution Types

### Adding Behaviors
Most common contribution type. See [Adding Behaviors](./adding-behaviors.md).

**Quick checklist:**
- [ ] Follow [Behavior Definition Standard](../guides/behavior-definition-standard.md)
- [ ] Create 4 required files (schema, definition, behavior, test)
- [ ] Write comprehensive tests
- [ ] Update documentation
- [ ] Submit PR

### Fixing Bugs
Found a bug? Great!

**Process:**
1. Check if issue already exists
2. Create task in `docs/tasks/`
3. Follow PDSRTDD workflow
4. Include test that fails before fix
5. Verify all tests pass after fix

### Improving Documentation
Documentation improvements are always welcome!

**Guidelines:**
- Keep examples current with API
- Test all code snippets
- Cross-reference related docs
- Update relevant README.md files

### Core System Changes
Changes to core system (registry, behavioral-host, etc.)

**Important:**
- Must discuss in issue first
- Requires architect approval
- Must not break existing behaviors
- Comprehensive test coverage required

## 🏗️ Development Workflow

### PDSRTDD
All code changes follow the **PDSRTDD** workflow:

1. **Plan** - Create task in `docs/tasks/`
2. **Design** - Define data shapes and state
3. **Schema** - Create TypeBox/Zod schema (the contract)
4. **Registry** - Register behavior if needed
5. **Test** - Write failing tests (Red)
6. **Develop** - Implement to pass tests (Green)
7. **Document** - Update relevant docs

See [AGENTS.md](../../AGENTS.md) for detailed workflow.

### Branch Strategy
- Work in feature branches or git worktrees
- **Never commit directly to main** (except TASKS.md updates)
- Use task-based branch names: `task/behavior-name`

### Task Management
- Create task file in `docs/tasks/YYYYMMDD-HHMMSS-task-name/`
- Lock task in TASKS.md with `[-]`
- Log progress in task's LOG.md
- Mark complete in TASKS.md with `[x]`

## 🧪 Testing Standards

All contributions must include tests:

### For Behaviors
- Lifecycle tests (connect/disconnect)
- Attribute change tests
- Command tests (if applicable)
- Integration tests
- Edge case coverage

### For Core Changes
- Unit tests for new functions
- Integration tests for system changes
- Regression tests for bug fixes
- All existing tests must pass

### Test Requirements
- Use Vitest and JSDOM
- No global state pollution
- Clean up after tests
- Descriptive test names
- Test both success and error cases

## 📖 Documentation Standards

### Code Documentation
- JSDoc comments for public APIs
- Inline comments for complex logic
- Type annotations for all functions
- No `any` types (use `unknown` and narrow)

### Guide Documentation
- Working code examples
- Step-by-step instructions
- Troubleshooting tips
- Cross-references to related docs

## 🎨 Code Style

### TypeScript
- Strict mode enabled
- No `any` types
- Explicit return types for public functions
- camelCase for functions/variables
- PascalCase for types/interfaces

### Naming Conventions
- Behaviors: kebab-case (`reveal`, `json-template`)
- Attributes: `{behavior-name}-{attribute-name}`
- Commands: `--{command-name}` (double-dash prefix)
- Event handlers: camelCase (`onCommand`, `onClick`)

### File Organization
Every behavior follows this exact structure:
```
behavior-name/
├── _behavior-definition.ts
├── schema.ts
├── behavior.ts
└── behavior.test.ts
```

## 🔐 Principles

From [AGENTS.md](../../AGENTS.md):

1. **Single Source of Truth** - Derive types from data, never manually define
2. **Readonly Metadata** - Immutable fields with literal types
3. **Export Singletons** - Create once, reuse everywhere
4. **Natural Keys** - Use self-documenting identifiers
5. **Type-Safe Registry** - Arrays with `as const` for registries
6. **Data-First Design** - Define data structures first, derive everything

## 🤝 Getting Help

- **Questions?** Open a discussion on GitHub
- **Stuck?** Check existing behaviors for patterns
- **Unclear?** Ask in issue before implementing

## 📝 PR Checklist

Before submitting a pull request:

- [ ] All tests pass (`npm test`)
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Examples work
- [ ] No breaking changes (or documented migration)
- [ ] Task marked complete
- [ ] PR description explains changes

## 🏆 Recognition

Contributors are credited in:
- Git commit history
- Release notes
- Special mention for major contributions

---

**Ready to contribute?** Start with [Adding Behaviors](./adding-behaviors.md) or [Agent Prompts](./agent-prompts/README.md).

**Last updated:** 2026-02-26
