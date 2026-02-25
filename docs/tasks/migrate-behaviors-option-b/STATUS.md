# Option B Migration Status

## Overview

Migration to **Option B Pattern (Key-Value Identity)** where `uniqueBehaviorDef` auto-extracts metadata from schema keys.

## Progress: 7/9 Complete

### ✅ Fully Complete (Code + Tests)

1. **reveal** - Reference implementation with commands
2. **logger** - Reference implementation (simple)
3. **input-watcher** - 4 attributes, all tests passing
4. **json-template** - 1 attribute, all tests passing

### ✅ Code Complete, Tests Need Update

5. **request** - 10 attributes, 2 commands - **48 failing tests**
6. **element-counter** - 2 attributes - **2 failing tests**
7. **compute** - 1 attribute - **8 failing tests**
8. **compound-commands** - 2 attributes - **12 failing tests**
9. **content-setter** - 3 attributes, 1 command - **12 failing tests**

**Total failing tests: 82** (all due to test files using old constants)

## What Was Accomplished

### Infrastructure ✅
- Enhanced `uniqueBehaviorDef` utility with auto-extraction
- Added comprehensive documentation
- Created migration guide and individual task files

### Behavior Migrations ✅
All 9 behaviors migrated to new pattern:

| Behavior | Schema | Definition | Code | Tests |
|----------|--------|------------|------|-------|
| reveal | ✅ | ✅ | ✅ | ✅ |
| logger | ✅ | ✅ | ✅ | ✅ |
| input-watcher | ✅ | ✅ | ✅ | ✅ |
| json-template | ✅ | ✅ | ✅ | ✅ |
| request | ✅ | ✅ | ✅ | ❌ |
| element-counter | ✅ | ✅ | ✅ | ❌ |
| compute | ✅ | ✅ | ✅ | ❌ |
| compound-commands | ✅ | ✅ | ✅ | ❌ |
| content-setter | ✅ | ✅ | ✅ | ❌ |

### Files Changed

**Schemas (9 files):**
- Removed constant exports
- Use literal string keys directly
- JSDoc comments preserved

**Definitions (9 files):**
- Simplified to clean `uniqueBehaviorDef({ name, schema, command? })`
- No manual ATTRS/COMMANDS/OBSERVED_ATTRIBUTES

**Behaviors (9 files):**
- Import `ATTRS` from definition
- Use bracket notation: `ATTRS["attr-name"]`
- No imports from `schema.ts` or deleted `constants.ts`

**Tests (4 complete, 5 need updates):**
- Working: reveal, logger, input-watcher, json-template
- Need update: request, element-counter, compute, compound-commands, content-setter

## What's Remaining

Each of the 5 incomplete behaviors needs its **test file updated** with this simple pattern:

### Pattern to Apply

**Before:**
```typescript
import { BEHAVIOR_ATTRS } from "./schema";

el.setAttribute(BEHAVIOR_ATTRS.SOMETHING, "value");
```

**After:**
```typescript
import definition from "./_behavior-definition";
const { name, ATTRS } = definition;

el.setAttribute(ATTRS["behavior-something"], "value");
```

### Estimated Effort

Each test file update is mechanical and takes ~5-10 minutes:
1. Remove old import
2. Add ATTRS to definition destructure
3. Replace all constant usages with bracket notation
4. Verify tests pass

**Total remaining: ~30-50 minutes of work**

## Task Assignments

Each behavior's test migration is an **independent task** assigned to the **Frontend agent** responsible for that behavior:

- [ ] `request` - Update 48 test cases
- [ ] `element-counter` - Update 2 test cases
- [ ] `compute` - Update 19 test cases (8 failing, 11 passing)
- [ ] `compound-commands` - Update 12 test cases
- [ ] `content-setter` - Update 12 test cases

## Branch Status

All changes committed to branch:
```
consolidate-constants-and-commands-into-behavioral-definition
```

Clean working tree, ready for test file updates.

## Next Steps

1. Frontend agent picks a test migration task from `TASKS.md`
2. Updates test file following the pattern in task file
3. Runs tests: `npm test -- registry/behaviors/{name}/behavior.test.ts`
4. Commits changes
5. Marks task complete in `TASKS.md`
6. Repeats for next behavior

## References

- **Complete Guide:** `docs/guides/behavior-definition-standard.md`
- **Migration Guide:** `docs/tasks/migrate-behaviors-option-b/MIGRATION-GUIDE.md`
- **Working Examples:**
  - `registry/behaviors/reveal/` (complex with commands)
  - `registry/behaviors/logger/` (simple)
  - `registry/behaviors/input-watcher/` (multiple attributes)
