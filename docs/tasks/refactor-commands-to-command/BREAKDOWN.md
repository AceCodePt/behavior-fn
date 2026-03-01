# Task Breakdown: Commands → Command Refactoring

## Overview

This refactoring aligns our internal naming with the **Invoker Commands API** standard by renaming the `commands` property to `command` throughout the project.

## Why This Change?

The web standard uses **singular** naming:
- HTML attribute: `command="--show"` (not `commands`)
- Event property: `event.command` (not `event.commands`)
- Our code should match: `definition.command` (not `definition.commands`)

## Two Separate Subtasks

### ✅ Subtask 1: Code Refactoring
**Branch:** `refactor/command-property-code`  
**Focus:** TypeScript files only

**Changes:**
1. **Core Types** (`registry/behaviors/behavior-utils.ts`)
   - `UniqueBehaviorDef` interface: `commands?: C` → `command?: C`
   - Validation logic updates

2. **Behavior Definitions** (All `_behavior-definition.ts` files)
   - Property name: `commands: { ... }` → `command: { ... }`
   - Files: `reveal`, `request`, `set-value`, `compound-commands`

3. **Behavior Implementations** (All `behavior.ts` files)
   - Destructuring: `const { commands }` → `const { command }`
   - References: `if (!commands)` → `if (!command)`
   - Access: `commands["--show"]` → `command["--show"]`

4. **Tests** (All `behavior.test.ts` files)
   - Variable extraction: `const { commands }` → `const { command }`
   - Usage: Update all test references

5. **CLI** (`src/commands/list.ts`)
   - Metadata property: `commands: []` → `command: []`
   - Regex pattern: Update extraction logic
   - Display: "Commands:" → "Command:"

**Files Affected (~50+ files):**
- `registry/behaviors/behavior-utils.ts`
- `registry/behaviors/behavior-registry.ts`
- `registry/behaviors/reveal/*`
- `registry/behaviors/request/*`
- `registry/behaviors/set-value/*`
- `registry/behaviors/compound-commands/*`
- `registry/behaviors/content-setter/*` (if has commands)
- `src/commands/list.ts`

**Verification:**
```bash
pnpm test        # All tests must pass
pnpm check       # Type checking must pass
pnpm build       # Build must succeed
grep -r "definition.commands" registry/  # Should return nothing
grep -r "const { commands }" registry/   # Should return nothing
```

---

### 📚 Subtask 2: Documentation Updates
**Branch:** `docs/command-terminology-alignment`  
**Focus:** Markdown files only

**Changes:**
1. **Core Docs**
   - `AGENTS.md` - Code examples and patterns
   - `README.md` - Behavior documentation sections
   - `CDN-ARCHITECTURE.md` - References

2. **Guides** (`docs/guides/`)
   - `behavior-definition-standard.md` - All pattern examples
   - `testing-behaviors.md` - Test patterns
   - `using-behaviors.md` - Usage examples

3. **Task Docs** (`docs/tasks/`)
   - Update all `task.md` and `LOG.md` files
   - Change code examples from `commands:` to `command:`

4. **Architecture** (`docs/architecture/`)
   - `command-protocol.md` - Terminology alignment

**Search Patterns:**
```bash
# Find code blocks with "commands:"
rg "commands:\s*\{" docs/ --type md

# Find prose references to "definition.commands"
rg "definition\.commands" docs/ --type md

# Find destructuring examples
rg "const \{ commands \}" docs/ --type md
```

**What NOT to Change:**
- ❌ "Invoker Commands API" (proper noun)
- ❌ "multiple commands" in prose (grammatically correct)
- ❌ "compound-commands" behavior name
- ❌ "src/commands/" directory references

**Verification:**
```bash
# No code blocks should show "commands:" property
rg "commands:\s*\{" docs/ --type md

# All examples should use "command:"
rg "command:\s*\{" docs/ --type md

# Markdown should still be valid
markdownlint docs/
```

---

## Migration Impact

**Breaking Change for Library Users:**
```typescript
// ❌ OLD (will break after this refactor)
import definition from "./behaviors/reveal/_behavior-definition";
const { commands } = definition;
if (e.command === commands["--show"]) { /* ... */ }

// ✅ NEW (correct after this refactor)
import definition from "./behaviors/reveal/_behavior-definition";
const { command } = definition;
if (e.command === command["--show"]) { /* ... */ }
```

**Not Breaking:**
- Behavior names remain unchanged (`compound-commands` stays)
- CLI commands directory (`src/commands/`) stays
- HTML attributes (`command="--show"`) already correct
- Event properties (`e.command`) already correct

---

## Execution Order

**Recommended:** Do code first, then docs

1. **Complete Code Refactoring** (Subtask 1)
   - Ensures all examples in docs will be correct
   - Tests verify functionality preserved
   
2. **Complete Documentation** (Subtask 2)
   - Update examples to match new code
   - No risk of docs showing outdated patterns

**Alternative:** Can be done in parallel if careful about merge conflicts

---

## Success Criteria

### Code Subtask
- [ ] All TypeScript uses `command` (singular)
- [ ] All tests pass
- [ ] Type checking passes
- [ ] No `definition.commands` references remain
- [ ] CLI output shows "Command:" not "Commands:"

### Documentation Subtask
- [ ] All code examples use `command:`
- [ ] Prose reads naturally
- [ ] No outdated `definition.commands` examples
- [ ] Cross-references valid
- [ ] Markdown linting passes

### Combined
- [ ] Project builds successfully
- [ ] All tests pass
- [ ] Documentation matches implementation
- [ ] Breaking change documented in CHANGELOG/migration guide
