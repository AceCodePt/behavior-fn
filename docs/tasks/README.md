# Tasks

Development tasks, planning documents, and work logs for BehaviorFN.

## 📋 Task Structure

Each task is a directory with:
```
YYYYMMDD-HHMMSS-task-name/
├── TASK.md   # Requirements, context, acceptance criteria
└── LOG.md    # Progress log (optional)
```

## 🎯 Task Status

Tasks are tracked in [TASKS.md](../../TASKS.md) at the repository root:

- `[ ]` - Backlog (not started)
- `[-]` - In Progress (locked by someone)
- `[x]` - Complete
- `[~]` - Blocked or deferred

## 🆕 Recent Tasks

### Active
- [Audit Documentation](./20260226-182707-audit-documentation/) - Review all docs for accuracy
- [Audit Core Files](./20260226-182800-audit-core-files/) - Review core implementation files

### Recently Completed
- [ESM Only - Drop IIFE](./esm-only-drop-iife/) - Removed IIFE builds, ESM only
- [JSON Template Slice](./json-template-slice/) - Added array slicing to json-template
- [JSON Template Negative Indices](./json-template-negative-indices/) - Support negative array indices
- [Add Array Swap Strategies](./add-array-swap-strategies/) - Multiple array merge strategies
- [Add Fallback Operator](./add-fallback-operator/) - Support `||`, `??`, `&&` in templates

## 📂 Task Categories

### Behaviors
Tasks related to creating or improving behaviors:
- `json-template-*` - JSON template behavior features
- `migrate-behavior-*` - Migrating behaviors to new patterns
- `reimplement-*` - Behavior reimplementations

### Build System
Tasks related to build and tooling:
- `cdn-*` - CDN build improvements
- `fix-cdn-*` - CDN build fixes
- `build-*` - General build system

### CLI
Tasks related to the command-line interface:
- `create-cli` - CLI creation
- `create-cli-*` - CLI commands
- `smart-validator-detection` - Auto-detect validators

### Architecture
Tasks related to system architecture:
- `behavior-validation-standards` - Validation patterns
- `behavioral-host` - Host implementation
- `refactor-*` - Architectural refactors
- `type-safety-*` - Type system improvements

### Documentation
Tasks related to documentation:
- `docs-site` - Documentation website
- `audit-documentation` - Doc review
- Current task: `20260226-182707-audit-documentation`

### Testing
Tasks related to testing:
- `test-*` - Test improvements
- `fix-*-tests` - Test fixes

## 🔍 Finding Tasks

### By Status
Check [TASKS.md](../../TASKS.md) for current status of all tasks.

### By Category
Browse this directory - tasks are grouped by prefix or theme.

### By Date
Task directories are prefixed with `YYYYMMDD-HHMMSS` for chronological ordering.

## 📝 Creating a Task

### Template
Use [task template](../templates/task.md) to create new tasks.

### Required Fields
- **Status:** Pending/In Progress/Complete
- **Created:** Date
- **Priority:** High/Medium/Low
- **Complexity:** High/Medium/Low
- **Context:** Why this task exists
- **Goal:** What success looks like
- **Acceptance Criteria:** Testable requirements

### Process
1. Create directory: `docs/tasks/YYYYMMDD-HHMMSS-task-name/`
2. Create `TASK.md` from template
3. Add to [TASKS.md](../../TASKS.md) as `[ ]` (backlog)
4. Lock when starting: `[-]`
5. Create `LOG.md` to track progress
6. Mark complete when done: `[x]`

## 🏗️ Task Workflow (PDSRTDD)

1. **Plan (P):** Create task with TASK.md
2. **Design (D):** Define data shapes
3. **Schema (S):** Create TypeBox schema
4. **Registry (R):** Register if needed
5. **Test (T):** Write failing tests (Red)
6. **Develop (DD):** Implement (Green)

See [AGENTS.md](../../AGENTS.md) for complete workflow.

## 📊 Task Statistics

Total tasks: ~60 (approximate count of directories)

Breakdown by status (check [TASKS.md](../../TASKS.md) for current counts):
- Backlog: Multiple tasks pending
- In Progress: Varies by active development
- Complete: Many foundational tasks done
- Blocked: Few tasks waiting on dependencies

## 🤝 Contributing Tasks

When contributing:
1. Check if similar task exists
2. Use template for consistency
3. Be specific in acceptance criteria
4. Include relevant context
5. Link to related tasks/issues

## 🔗 Related Documentation

- [AGENTS.md](../../AGENTS.md) - Development workflow
- [Contributing](../contributing/README.md) - Contribution guidelines
- [Architecture](../architecture/README.md) - System architecture
- [Templates](../templates/README.md) - Task templates

---

**Looking for something specific?** Check [TASKS.md](../../TASKS.md) or search this directory.

**Last updated:** 2026-02-26
