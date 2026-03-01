# Refactor `commands` to `command` Throughout Project

## Goal

Align all terminology with the **Invoker Commands API** standard by renaming `commands` (plural) to `command` (singular) throughout the codebase and documentation. This reflects the API's naming convention where the attribute is `command` (not `commands`).

## Context

The project currently uses `commands` in many places:
- Type definitions: `commands?: Record<string, string>`
- Property names in definitions: `definition.commands`
- Variable names: `const { commands } = definition`
- Documentation references to "commands object"
- Behavior names: `compound-commands` behavior

However, the Invoker Commands API uses **singular** `command`:
- HTML attribute: `<button command="--show">`
- Event property: `e.command`
- API naming: "Invoker **Command**s API" (plural API, singular attribute)

We should align our internal naming to match the standard for consistency.

## Scope

This refactoring affects:

### Code Changes (TypeScript)
1. **Core Types & Utilities** (`registry/behaviors/`)
   - `behavior-utils.ts` - Type definitions (`commands` → `command`)
   - `behavior-registry.ts` - JSDoc comments
   - `types.ts` - Interface definitions (if any)

2. **All Behavior Definitions** (`registry/behaviors/*/`)
   - `_behavior-definition.ts` - Property name (`commands:` → `command:`)
   - `behavior.ts` - Destructuring and references (`const { commands }` → `const { command }`)
   - `behavior.test.ts` - Test variable names and references
   - `schema.ts` - JSDoc comments mentioning "commands"

3. **Test Harness**
   - `command-test-harness.ts` - Already correctly named (no changes)

4. **CLI Commands** (`src/commands/`)
   - `list.ts` - Metadata extraction and display logic
   - JSDoc comments in all command files

5. **Registry Behavior Name**
   - `compound-commands/` directory → Keep as-is (behavior name)
   - Internal references within compound-commands → Update to `command`

### Documentation Changes (Markdown)
1. **Core Documentation**
   - `AGENTS.md` - All references to `commands` property/object
   - `README.md` - Behavior documentation sections
   - `CDN-ARCHITECTURE.md` - References to compound-commands

2. **Guides** (`docs/guides/`)
   - `behavior-definition-standard.md` - Pattern examples and explanations
   - `testing-behaviors.md` - Test patterns (if applicable)
   - `using-behaviors.md` - Usage examples (if applicable)
   - `worktree-management.md` - (verify, likely no changes)

3. **Task Documentation** (`docs/tasks/`)
   - All `task.md` and `LOG.md` files that reference `commands`
   - Update historical context where relevant

4. **Architecture Documentation** (`docs/architecture/`)
   - `command-protocol.md` - Terminology alignment

### JSON Configuration
- `registry/behaviors-registry.json` - Behavior names (keep as-is)

## Key Decisions

### What to Rename
- ✅ **Type property**: `commands` → `command` in `UniqueBehaviorDef`
- ✅ **Variable names**: `const { commands }` → `const { command }`
- ✅ **JSDoc/comments**: References to "commands object" → "command object"
- ✅ **Documentation**: All prose references to the property/concept

### What NOT to Rename
- ❌ **Behavior name**: `compound-commands` stays as-is (kebab-case behavior name)
- ❌ **Directory names**: `src/commands/` stays as-is (CLI commands)
- ❌ **File names**: `command-test-harness.ts` already correct
- ❌ **API terminology**: "Invoker Commands API" (proper noun, stays plural)
- ❌ **Prose discussing multiple commands**: "multiple commands" in documentation is fine

### Naming Pattern
```typescript
// BEFORE
const definition = uniqueBehaviorDef({
  name: "reveal",
  schema,
  commands: {
    "--show": "--show",
    "--hide": "--hide",
  },
});

const { commands } = definition;
if (e.command === commands["--show"]) { }

// AFTER
const definition = uniqueBehaviorDef({
  name: "reveal",
  schema,
  command: {
    "--show": "--show",
    "--hide": "--hide",
  },
});

const { command } = definition;
if (e.command === command["--show"]) { }
```

## Implementation Plan

This task should be split into **two separate subtasks**:

### Subtask 1: Code Refactoring
**Branch:** `refactor/command-property-code`

**Files to modify:**
1. `registry/behaviors/behavior-utils.ts`
   - Type `UniqueBehaviorDef`: `commands?: C` → `command?: C`
   - Validation logic: `if (def.commands)` → `if (def.command)`
   
2. `registry/behaviors/behavior-registry.ts`
   - JSDoc: Update `@param definition` description

3. All behavior `_behavior-definition.ts` files:
   - `reveal/_behavior-definition.ts`
   - `request/_behavior-definition.ts`
   - `set-value/_behavior-definition.ts`
   - `compound-commands/_behavior-definition.ts`
   - Property: `commands: { ... }` → `command: { ... }`

4. All behavior `behavior.ts` files:
   - Destructuring: `const { commands } = definition` → `const { command } = definition`
   - References: `if (!commands)` → `if (!command)`
   - Access: `commands["--show"]` → `command["--show"]`

5. All behavior `behavior.test.ts` files:
   - Extraction: `const { commands } = definition` → `const { command } = definition`
   - Usage: `commands["--trigger"]` → `command["--trigger"]`
   - Variable naming in local tests (if any)

6. `src/commands/list.ts`
   - Regex: `/commands:\s*\{/` → `/command:\s*\{/`
   - Display: `Commands:` → `Command:` (output label)
   - Metadata: `commands: string[]` → `command: string[]`

**Verification:**
- [ ] All tests pass (`pnpm test`)
- [ ] Type checking passes (`pnpm check`)
- [ ] No references to `definition.commands` remain (search codebase)
- [ ] `pnpm list-behaviors` output shows "Command:" not "Commands:"

### Subtask 2: Documentation Updates
**Branch:** `docs/command-terminology-alignment`

**Files to modify:**
1. `AGENTS.md`
   - Section "Behavior Definition Standard" - Code examples
   - Section "Testing Standards" - Module-level extraction pattern
   - Section "Documenting New Behaviors" - Required elements list

2. `README.md`
   - Behavior documentation sections (reveal, request, set-value, compound-commands)
   - "Commands:" sections → "Command:" (if referring to the property)
   - Keep "Commands" where it means "list of commands" in prose

3. `docs/guides/behavior-definition-standard.md`
   - All code examples showing `commands:` property
   - Pattern explanations
   - Keep "commands" in prose where grammatically correct

4. `docs/tasks/*/task.md` and `LOG.md`
   - Search for ` commands:` or `definition.commands`
   - Update to `command:` / `definition.command`
   - Preserve historical context (no need to change descriptions)

5. `CDN-ARCHITECTURE.md`
   - Update any code references (likely minimal)

**Verification:**
- [ ] No code blocks show `commands:` property (use `command:`)
- [ ] All examples compile/make sense
- [ ] Prose still reads naturally ("commands" plural is fine in text)
- [ ] Cross-references are consistent

## Testing Strategy

### Code Changes Testing
1. **Unit Tests**: All existing tests should pass without modification (only variable names change)
2. **Type Tests**: Verify `definition.command` is correctly typed
3. **CLI Test**: Run `pnpm list-behaviors` and verify output

### Documentation Testing
1. **Markdown Linting**: Ensure no broken formatting
2. **Code Block Validation**: Spot-check examples compile correctly
3. **Cross-Reference Check**: Verify links and references still valid

## Migration Notes

**For Users:**
This is a **breaking change** for anyone directly accessing `definition.commands` in custom code:

```typescript
// OLD (will break)
const { commands } = myBehaviorDefinition;

// NEW (correct)
const { command } = myBehaviorDefinition;
```

**Behavior names** (like `compound-commands`) are **not affected**.

## Dependencies

None. This is a pure refactoring task.

## Success Criteria

- [ ] All TypeScript code uses `command` (singular) for the property
- [ ] All tests pass with updated variable names
- [ ] All documentation examples show `command:` in definitions
- [ ] CLI `list` command displays "Command:" not "Commands:"
- [ ] No references to `definition.commands` or `const { commands }` remain in codebase
- [ ] Prose in documentation still reads naturally (plural "commands" is fine)
- [ ] Type safety maintained throughout

## Notes

- This refactoring does NOT change the behavior or functionality
- It's purely a terminology alignment for consistency with web standards
- The Invoker Commands API is called "Commands" (plural) but the attribute is `command` (singular)
- We align with the attribute naming convention
